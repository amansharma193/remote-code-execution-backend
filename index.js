const { spawn } = require('child_process');
const fs = require('fs');
const tmp = require('tmp');

// Helper function to execute shell commands with safe input
const runCommand = (command, args, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { timeout });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (err) => {
      reject(new Error(`Error spawning process: ${err.message}`));
    });

    process.on('close', (code) => {
      if (code !== 0 || stderr) {
        reject(new Error(`Process failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

// Function to execute Python code safely
async function executePython(code) {
  const tempFile = tmp.fileSync({ postfix: '.py' }).name;
  fs.writeFileSync(tempFile, code);

  try {
    return await runCommand('python3', [tempFile]);
  } catch (error) {
    throw new Error(`Error executing Python code: ${error.message}`);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

// Function to execute Java code safely
async function executeJava(code) {
  const tempDir = tmp.dirSync().name;
  const sourceFile = `${tempDir}/Main.java`;
  fs.writeFileSync(sourceFile, code);

  try {
    await runCommand('javac', [sourceFile]);
    return await runCommand('java', ['-cp', tempDir, 'Main']);
  } catch (error) {
    throw new Error(`Error executing Java code: ${error.message}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Function to execute C++ code safely
async function executeCpp(code) {
  const tempDir = tmp.dirSync().name;
  const sourceFile = `${tempDir}/main.cpp`;
  fs.writeFileSync(sourceFile, code);

  try {
    await runCommand('g++', [sourceFile, '-o', `${tempDir}/main`]);
    return await runCommand(`${tempDir}/main`, []);
  } catch (error) {
    throw new Error(`Error executing C++ code: ${error.message}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Function to execute JavaScript code safely
async function executeJavaScript(code) {
  const tempFile = tmp.fileSync({ postfix: '.js' }).name;
  fs.writeFileSync(tempFile, code);

  try {
    return await runCommand('node', [tempFile]);
  } catch (error) {
    throw new Error(`Error executing JavaScript code: ${error.message}`);
  } finally {
    fs.unlinkSync(tempFile);
  }
}

// Lambda handler function
exports.handler = async (event) => {
  try {
    const { language, code } = event;

    if (!['java', 'cpp', 'javascript', 'python'].includes(language)) {
      return {
        statusCode: 400,
        body: JSON.stringify("Unsupported language!"),
      };
    }

    let output;
    switch (language) {
      case 'java':
        output = await executeJava(code);
        break;
      case 'cpp':
        output = await executeCpp(code);
        break;
      case 'javascript':
        output = await executeJavaScript(code);
        break;
      case 'python':
        output = await executePython(code);
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
