import React, { useEffect, useRef, useState } from "react"
import './index.less'

const notExtensions = ['chrome.google.com', 'chrome://']
export default function(){
    const pickerRef = useRef<string>('#ffffff')
    const [,update] = useState({})

    useEffect(()=>{
        chrome.storage.sync.get('picker', ({picker})=>{
            if(picker) {
                pickerRef.current = picker
                update({})
            }
        })
    }, [])

    function get(){
        chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
            const {id, windowId} = tabs[0]
            chrome.scripting.executeScript({
                target: {tabId: id as number, allFrames: true},
                files: ["inject/pickerInject.js"]
            })
            .then(()=>{
                chrome.tabs.sendMessage(id as number, {type: 'currentWindowId', message: windowId})
                // 关闭 popup
                window.close()
            })
        })
    }

    function isDisable(){
        return notExtensions.includes(window.location.href)
    }

    return <div style={{width: '300px', height: '200px'}}>
        {/* <button onClick={get} disabled={isDisable()} >{
            isDisable() ? 'current page not work' : 'get color'
        }</button> */}
        <button onClick={get} >get color</button>
        <div className="picker-outer">
            <div className="picker" style={{background: pickerRef.current}}></div>
            <div className="picker-text">{pickerRef.current}</div>
        </div>
    </div>
}