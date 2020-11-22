const net = require('net')
const fs = require('fs')
const path = require('path')

const users = require('./users.json')

const [port = 5000] = process.argv.slice(2);

const HELP =
`
LIST OF AVAILABLE COMMANDS:
\tUSER <username>: check if the user exist
\tPASS <password>: authenticate the user with a password
\tLIST: list the current directory of the server
\tCWD <directory>: change the current directory of the server
\tRETR <filename>: transfer a copy of the file FILE from the server to the client
\tSTOR <filename>: transfer a copy of the file FILE from the client to the server
\tPWD: display the name of the current directory of the server
\tHELP: send helpful information to the client
\tQUIT: close the connection and stop the program
`

const server = net.createServer((socket) => {
  console.log('New client connected...')

  // Connection variables
  let sessionUser = null;
  let authentificated = true;
  let currentPath = path.resolve('./');

  socket.write('Connected to FTP server')

  socket.on('data', (data) => {
    try {
      const [directive, parameter] = data.toString().split(' ')

      switch (directive) {
        case 'USER':
          const user = users.find(user => user.name === parameter)

          if (user) {
            sessionUser = user
            socket.write('User OK')
          } else {
            socket.write('User not found')
          }
          break
        case 'PASS':
          if (authentificated) {
            socket.write('Already authentificated')
          } else if (sessionUser === null) {
            socket.write('Enter a valid user using the USER command')
          } else if (sessionUser.password !== parameter) {
            socket.write('Wrong password please retry')
          } else {
            socket.write('Authentificated')
            authentificated = true
          }
          break

        case 'LIST':
          if (authentificated) {
            const files = fs.readdirSync(currentPath)

            socket.write('LIST \n' + files.join(' '))
          } else {
            socket.write('Forbidden: Not authentificated')
          }
          break
        case 'CWD':
          if (authentificated) {
            try {
              const newPath = path.resolve(currentPath + '/' + parameter)

              /*
              Checking if new path exists if fs.readdirSync throws an error,
              it means the directory doesn't exists
              */
              fs.readdirSync(newPath)

              socket.write(`CWD ${parameter}`)
              currentPath = newPath
            } catch (error) {
              socket.write(`${parameter} does not exists or isn't a directory`)
            }
          } else {
            socket.write('Forbidden: Not authentificated')
          }
          break
        case 'PWD':
          if (authentificated) {
            socket.write('Current directory is: ' + currentPath)
          } else {
            socket.write('Forbidden: Not authentificated')
          }
          break
        case 'RETR':
          if (authentificated) {
            fs.readFile(`${currentPath}/${parameter}`, (err, data) => {
              if (err) {
                socket.write(`Error while opening file, file ${currentPath}/${parameter} does not exists`)
              } else {
                socket.write('FILE_CONTENT\n' + `${parameter}\n` + data)
              }
            })
          } else {
            socket.write('Forbidden: Not authentificated')
          }
          break
        case 'STOR':
          if (authentificated) {
            const inputLines = data.toString().split('\n')

            const fileData = inputLines.slice(1).join('\n') + '\n'

            console.log('fileData', fileData)

            const filePath = `client_${inputLines[0][1]}`

            fs.writeFile(filePath, fileData, error => {
              if (error) {
                console.error(error)
              } else {
                socket.write(`Client> File saved at ${filePath}`)
              }
            })
          } else {
            socket.write('FILE_CONTENT\n' + `${parameter}\n` + data)
          }
          break
        case 'QUIT':
          socket.destroy()
          break
        case 'HELP':
          socket.write(HELP)
          break
        default:
          socket.write(`Command "${directive}" invalid, type HELP for more info`)
      }
    } catch (error) {
      console.error(error)

      socket.write('Internal server error... closing connection...')
      socket.destroy(error)
    }

  })
})

server.listen(port, () => {
  console.log('Server started at 5000')
})