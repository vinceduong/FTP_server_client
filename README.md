## Simple FTP server and CLI client made in Node.js 

The server needs to be running to start the CLI client, default host is `localhost` on port `5000`
You need to run the server and the client in two differents terminals

Examples (parameters are optional): 
* Start the server `node myFtpServer.js 5000`
* Start the client `node myFtpClient.js localhost 5000`

You can find / modify the list of users in `users.json`

#### Commands

* `USER <username>`: check if the user exist
* `PASS <password>`: authenticate the user with a password
* `LIST`: list the current directory of the server
* `CWD <directory>`: change the current directory of the server
* `RETR <filename>`: transfer a copy of the file FILE from the server to the client
* `STOR <filename>`: transfer a copy of the file FILE from the client to the server
* `PWD`: display the name of the current directory of the server
* `HELP`: send helpful information to the client
* `QUIT`: close the connection and stop the program

The server is working with simple TCP socket and is able to copy files from server or client, and change directories
