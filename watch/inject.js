// 原因：parcel 没法对文件目录 -> 子目录 进行监听，需要自己生成 cli 
const {join, dirname} = require('path')
const fs = require('fs')
const child_process = require('child_process')
const watch = require('node-watch')

const parcelRunArg = process.argv[2]
const root = dirname(__dirname)
const injectDir = join(root, '/src/inject')
const watchFileType = ['js', 'ts', 'css', 'less']

// 生成 dirArray
const dirArray = []
function generateDirArray(dir){
    dirArray.push(dir)
    fs.readdirSync(dir).forEach((file)=>{
        const filePath = join(dir, file)
        // 是否为目录
        if(fs.statSync(filePath).isDirectory()){
            generateDirArray(filePath)
        }
    })
}
generateDirArray(injectDir)

/**
 * 生成 [npx parcel ... F:\\chrome-test\\chrome-extensions-template\\src\\inject\\*.ts --dist-dir F:\\chrome-test\\chrome-extensions-template\\dist\\inject\\]
 * */ 
function generateCommad(dirPath){
    const enterPath = watchFileType.reduce((prev, type)=>{
        prev += ` ${dirPath}\\*.${type}`
        return prev
    }, '')
    const addparcelNoHmr = parcelRunArg === 'watch' ? ' --no-hmr' : ''
    const distPath = dirPath.replace('src', 'dist')
    const after = enterPath + ` --dist-dir ${distPath} ${addparcelNoHmr}`
    return (`npx parcel ${parcelRunArg}` + after).replace(/\\/g, '\\\\')
}
const commandArray = dirArray.reduce((prev, dirPath)=>{
    prev.push(generateCommad(dirPath))
    return prev
},[])

// 运行子程序
function runChildShell(command){
    const processExec = child_process.exec(`${command}`, {})
    processExec.stdout.on('data', data=>{
        console.log(data.toString())
    })
    processExec.stderr.on('data', data=>{
        console.log(data.toString())
    })

}
commandArray.forEach((command)=> runChildShell(command) )

if(parcelRunArg === 'watch'){
    // 监听 inject 文件夹创建文件夹 进行 parcel 监听
    watch(injectDir, {
        recursive: true
    }).on('change', function(evt, path){
        if(!path.includes('.') && !dirArray.includes(path)){
            // 如果是目录，并且内部不存在。防止重复
            dirArray.push(path)
            runChildShell(
                generateCommad(path)
            )
        }
    })
}