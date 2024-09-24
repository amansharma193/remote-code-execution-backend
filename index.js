const { spawn } = require("child_process");
const fs = require("fs");
const tmp = require("tmp");

// Helper function to execute shell commands with safe input
const runCommand = (command, args, input = "", timeout = 20000) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    // Write input to the process's stdin
    if (input) {
      process.stdin.write(input);
      process.stdin.end(); // Close stdin after writing
    }

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("error", (err) => {
      reject(new Error(`Error spawning process: ${err.message}`));
    });

    process.on("close", (code) => {
      if (code !== 0 || stderr) {
        reject(new Error(`Process failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

async function executeJava(code, userInput = "") {
  const tempDir = tmp.dirSync().name;
  const sourceFile = `${tempDir}/Main.java`;
  fs.writeFileSync(sourceFile, code);

  try {
    await runCommand("javac", [sourceFile]);

    return new Promise((resolve, reject) => {
      const process = spawn("java", ["-cp", tempDir, "Main"]);

      let stdout = "";
      let stderr = "";

      // Send user input to the Java program
      if (userInput) {
        process.stdin.write(userInput);
        process.stdin.end();
      }

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("error", (err) => {
        reject(new Error(`Error spawning process: ${err.message}`));
      });

      process.on("close", (code) => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        if (code !== 0 || stderr) {
          reject(new Error(`Process failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  } catch (error) {
    throw new Error(`Error executing Java code: ${error.message}`);
  }
}

async function executeCpp(code, userInput = "") {
  const tempDir = tmp.dirSync().name;
  const sourceFile = `${tempDir}/main.cpp`;
  fs.writeFileSync(sourceFile, code);

  try {
    // Compile the C++ code
    await runCommand("g++", [sourceFile, "-o", `${tempDir}/main`]);

    // Run the compiled C++ code with user input
    return await runCommand(`${tempDir}/main`, [], userInput);
  } catch (error) {
    throw new Error(`Error executing C++ code: ${error.message}`);
  } finally {
    // Clean up the temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function executeJavaScript(code, userInput = "") {
  const tempFile = tmp.fileSync({ postfix: ".js" }).name; // Create a temp file for the JS code
  fs.writeFileSync(tempFile, code); // Write code to the temp file

  // Check if the file exists before executing
  if (!fs.existsSync(tempFile)) {
    throw new Error(`File not found: ${tempFile}`);
  }

  try {
    const args = userInput.split(" "); // Split userInput into an array of arguments
    const process = spawn("node", [tempFile, ...args], { stdio: "pipe" }); // Pass arguments to the process

    let stdout = "";
    let stderr = "";

    // Capture stdout
    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    return new Promise((resolve, reject) => {
      process.on("close", (code) => {
        fs.unlinkSync(tempFile); // Clean up the temp file after process completes
        if (code !== 0 || stderr) {
          reject(new Error(`Process failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });
    });
  } catch (error) {
    console.error(`Execution error: ${error.message}`); // Log the error
    throw new Error(`Error executing JavaScript code: ${error.message}`);
  }
}

async function executePython(code, userInput = "") {
  const tempFile = tmp.fileSync({ postfix: ".py" }).name;
  fs.writeFileSync(tempFile, code);

  try {
    // Execute the Python code with user input
    return await runCommand("python3", [tempFile], userInput);
  } catch (error) {
    throw new Error(`Error executing Python code: ${error.message}`);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
        body: JSON.stringify({}),
      };
    }

    const { language, code, userInput } = event;

    if (!["java", "cpp", "javascript", "python"].includes(language)) {
      return {
        statusCode: 400,
        body: JSON.stringify("Unsupported language!"),
      };
    }

    let output;
    switch (language) {
      case "java":
        output = await executeJava(code, userInput);
        break;
      case "cpp":
        output = await executeCpp(code, userInput);
        break;
      case "javascript":
        output = await executeJavaScript(code, userInput);
        break;
      case "python":
        output = await executePython(code, userInput);
        break;
      default:
        throw new Error("Unsupported language");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(output),
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify("Internal server error: " + error.message),
    };
  }
};
