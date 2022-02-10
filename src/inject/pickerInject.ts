// initElment() 原因：貌似因为 executeScript files。在第一次可以稳定运行，之后无法做到随时运行，必须包含在函数内。
import {throttle, debounce} from 'lodash-es'

// 存储windowId
let currentWindowId: string = ''
// 底部相关
let bottomReadOuter: HTMLDivElement | null = null
let readColorElement: HTMLDivElement | null= null
let currentColorStr: string = ''
// 截图canvas
let captureCanvas: HTMLCanvasElement | null = null
let captureCanvas2d: CanvasRenderingContext2D | null = null
// 放大镜 canvas
let amplifierCanvas: HTMLCanvasElement | null  = null
let amplifierCanvas2d: CanvasRenderingContext2D | null = null
// 保持清除 操作（dom、event）
let clear: Function | null = null;

// 创造element
function initElement(){
    // 展示栏 outer
    bottomReadOuter = document.createElement('div')
    bottomReadOuter.classList.add('bottomReadOuter')
    // 展示栏 read
    readColorElement = document.createElement('div')
    readColorElement.classList.add('readColor')
    bottomReadOuter.appendChild(readColorElement)
        // 添加body
    document.body.appendChild(bottomReadOuter)

    // 跟随鼠标移动的查看栏
    amplifierCanvas = document.createElement('canvas')
    amplifierCanvas.width = 50
    amplifierCanvas.height = 50
    amplifierCanvas.classList.add('amplifier')
    amplifierCanvas2d = amplifierCanvas.getContext('2d')
    document.body.appendChild(amplifierCanvas)
}

// 控制element的display
function elementDisplay(val: 'none' | 'block'){
    if(bottomReadOuter && amplifierCanvas){
        bottomReadOuter.style.display = val
        amplifierCanvas.style.display = val
    }
}

// 绑定 鼠标移动时的颜色
function initBind(){
    const scrollFn = throttle(getCaptureVisible, 400)
    const resizeFn = debounce(getCaptureVisible, 1000)
    const moveEvent: (ev: MouseEvent)=>void = ({clientX, clientY})=>{
        if(captureCanvas2d && amplifierCanvas2d) {
            const docElement = document.documentElement
            // 放大器 操作
                //移动
            amplifierCanvas!.style.left = clientX + docElement.scrollLeft + 10 + 'px'
            amplifierCanvas!.style.top = clientY + docElement.scrollTop + 10 + 'px'
                // 放大查看
            amplifierCanvas2d.drawImage(captureCanvas as HTMLCanvasElement, 
                Math.abs(clientX)-4.5, Math.abs(clientY)-4.5, 
                9, 9,
                0, 0,
                50, 50
            )
            // 获取颜色
            currentColorStr = `rgba(${Array.from(captureCanvas2d.getImageData(clientX, clientY, 1,1).data).join()})`
            readColorElement!.style.backgroundColor = currentColorStr
        }
    }
    const clickEvent = ()=>{
        clear = null
        // 取消绑定事件
        document.removeEventListener('mousemove', moveEvent)
        document.removeEventListener('click', clickEvent)
        document.removeEventListener('scroll', scrollFn)
        window.removeEventListener('resize', resizeFn)
        // 删除dom
        document.body.removeChild(bottomReadOuter as HTMLDivElement )
        document.body.removeChild(amplifierCanvas as HTMLCanvasElement )
        // 发送选择的 颜色
        chrome.runtime.sendMessage(chrome.runtime.id, {
            type: 'select',
            message: currentColorStr
        })
    }
    // 滚动，重新截图
    document.addEventListener('scroll', scrollFn)
    // 鼠标移动，设置当前像素
    document.addEventListener('mousemove', moveEvent)
    // 点击，移除 和 获取当前像素
    document.addEventListener('click', clickEvent)
    window.addEventListener('resize', resizeFn)
    return clickEvent
}

// 发送 message，截图
function getCaptureVisible(){
    elementDisplay('none')
    chrome.runtime.sendMessage({
        type: 'runtime',
        message: currentWindowId
    }, (response)=>{
        const {width, height, dataUri} = response.message
        const canvas = document.createElement('canvas')
        canvas.width = width as number
        canvas.height = height as number
        captureCanvas = canvas
        const image = new Image()
        image.width = width as number
        image.height = height as number
        image.src = dataUri
        image.onload = function(){
            captureCanvas2d = canvas.getContext('2d')
            captureCanvas2d?.drawImage(image, 0, 0, width, height)
        }
        elementDisplay('block')
    })
}

chrome.runtime.onMessage.addListener(({type, message})=>{
    if(clear) clear();
    if(type === 'currentWindowId') {
        currentWindowId = message
        initElement()
        getCaptureVisible()
        clear = initBind()
    }
})