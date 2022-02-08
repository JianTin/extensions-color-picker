let contentWindowId: string = ''

function setColorBadge(rgba: string){
    chrome.action.setBadgeText({text: 'color'})
    const colorArray = (rgba as string).replace('rgba(', '').replace(')', '').split(',').map(Number) as [number,number,number,number]
    chrome.action.setBadgeBackgroundColor({color: colorArray })
}

chrome.storage.sync.get('picker', ({picker})=>{
    picker ? setColorBadge(picker) : chrome.action.setBadgeText({text: 'not'})
})

function getPixelInfo(){
    return new Promise((res)=>{
        chrome.tabs.query({active: true, windowId: Number(contentWindowId)}, (tabs)=>{
            const {windowId, height, width} = tabs[0]
            chrome.tabs.captureVisibleTab(windowId,(dataUri)=>{
                console.log(dataUri)
                res({
                    type: 'captureTab', message: {dataUri, width, height}
                })
            })
        })
    })
}

chrome.runtime.onMessage.addListener((sendMessage, {}, sendResponse)=>{
    const {type, message} = sendMessage
    // 选择 颜色
    if(type === 'select'){
        // 设置徽章
        setColorBadge(message)
        // 存储 选择的颜色
        chrome.storage.sync.set({picker: message})
    } else if(type === 'runtime') { // 截图，发送到页面
        contentWindowId = message
        getPixelInfo().then(sendResponse)
        return true
    }
})