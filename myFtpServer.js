const net = require('net')
const fs = require('fs')
const path = require('path')

const users = [
  {
    name: 'Jean',
    password: 'mdp1'
  },
  {
    name: 'Francois',
    password: 'mdp2'
  }
]

const [port = 5000] = process.argv.slice(2);

const server = net.createServer((socket) => {
  console.log('New client connected')

  let sessionUser = null;
  let authentificated = true;
  let currentPath = path.resolve('./');

  console.log('currentPath', currentPath) 
  socket.write('Connected to FTP server')
  socket.on('data', (data) => {
  try {
    const message = data // Buffer < 0x00 ... >
    .toString() // PASS passsword\r\n
    .replace('\r\n', '') // PASS password
    .split(' ') // ['PASS', 'password']

    const directive = message[0]
    const parameter = message[1]

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

            fs.readdirSync(newPath)
            
            socket.write(`CWD ${parameter}`)
            currentPath = newPath
          } catch(error) {
            socket.write(`${parameter} does not exists or isn't a directory`)
          }
        } else {
          socket.write('Forbidden: Not authentificated')
        }
        break
      case 'PWD':
        if (authentificated) {
          socket.write('PWD ' + currentPath)
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
          const input = data.toString().split('\n')

 
          const fileData = input.slice(1).join('\n')

          console.log('fileData', fileData)

          const filePath = `client_${input[0][1]}`
 
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
        socket.write('Quitting ftp server... closing connection')
        socket.destroy()
        break
      default:
        socket.write(`404 Command "${directive}" not found`)
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