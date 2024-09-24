# Online Code Execution Platform

## Description
This project is an Online Code Execution Platform that allows users to run code snippets in various programming languages (Java, C++, JavaScript, Python) securely. Users can input their code along with any necessary user inputs, and the platform returns the output. The architecture is designed to handle multiple requests efficiently while ensuring that the code execution environment is isolated and secure.

## Tech Stack
- **Frontend**: React.js for building an interactive user interface.
- **Backend**: Node.js, running on AWS Lambda for scalable serverless computing.
- **Containerization**: Docker for packaging applications and dependencies to ensure consistency across different environments.
- **Additional Tools**: 
  - `child_process` for spawning child processes to execute code snippets.
  - `tmp` for secure temporary file handling.

## Importance and Speciality
1. **Safety and Security**: 
   - **Sandboxing**: The backend employs isolated environments for executing code. Each execution is contained within a temporary directory created dynamically, ensuring that no malicious code affects the underlying system.
   - **Timeouts**: Implemented process timeouts prevent infinite loops or excessive resource consumption.
   - **Error Handling**: Comprehensive error handling ensures that any issues during code execution do not crash the system, providing informative feedback to users.
   - **Input Validation**: Only specific programming languages are allowed for execution, reducing the risk of unauthorized commands.

2. **Scalability**: 
   - Utilizing **AWS Lambda** allows the application to automatically scale based on incoming requests, ensuring that the service remains available under varying loads.
   - Docker containers streamline the deployment process and guarantee that the code runs consistently across different environments, from local development to production.

3. **User Experience**: 
   - A responsive and interactive frontend built with React.js provides a seamless user experience. Users can easily input their code, view outputs, and interact with the application without delays.
   - Real-time output feedback ensures users can quickly iterate on their code, enhancing the learning experience.

## Conclusion
This Online Code Execution Platform not only showcases proficiency in modern web development practices but also emphasizes the importance of security and performance in backend development. By leveraging technologies like AWS Lambda and Docker, the project is both robust and scalable, ready to serve users efficiently.
