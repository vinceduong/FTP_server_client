const net = require('net')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
const fs = require('fs')

const client = net.Socket()

const args = process.argv.slice(2);

const [host = '127.0.0.1', port = 5000] = args;


client.connect(port, host, async () => {

  handleUserInput()
})

client.on('data', data => {
  const dataString = data.toString()
  const dataLines = dataString.split('\n')

  const firstLine = dataLines[0]

  if (firstLine === 'FILE_CONTENT') {
    const fileName = dataString.split('\n')[1]
 
    const fileContent = dataLines.slice(2).join('\n')
    
    const filePath = `./ftp_${fileName}`
 
    console.log(`client> Writing file to ${filePath}...`)

    fs.writeFile(filePath, fileContent, error => {
      if (error) {
        console.error(error)
      } else {
        console.log(`Client> File saved at ${filePath}`)
      }
      handleUserInput()
    })
  } else {
    console.log('ftp> ' + dataString)
    handleUserInput()
  }
})

function handleUserInput() {
  readline.question('>', input => {
    console.log('input', input)
    if (input.split(' ')[0] === 'STOR') {
      const fileName = input.split(' ')[1];

      fs.readFile(fileName, (err, data) => {
        if (err) {
          console.error(`client> Error while opening file, file ${fileName} does not exists`)
          handleUserInput()
        } else {
          client.write(input + '\n' + data.toString())
        }
      })
    } else {
      client.write(input)
    }
  })
}

client.on('error',
  error => {
    const { syscall } = error
    console.error(`client> Action ${syscall} failed... `)
    console.error(error)
    process.exit(5)
  }
)

client.on('close', () => {
  console.log('client> Server connection closed, quitting...')
  process.exit(0)
})