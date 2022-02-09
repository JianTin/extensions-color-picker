import React, { useEffect, useRef, useState } from "react"
import './index.less'
import {Utils} from 'rough-react-utils'

const {urlRunExtensions} = Utils

export default function(){
    const pickerRef = useRef<string>('#ffffff')
    const [isRun, setIsRun] = useState<boolean>(true)
    const [,update] = useState({})

    useEffect(()=>{
        chrome.storage.sync.get('picker', ({picker})=>{
            if(picker) {
                pickerRef.current = picker
                update({})
            }
        })
        urlRunExtensions([], setIsRun)
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

    return <div style={{width: '300px', height: '200px'}}>
        <button onClick={get} disabled={!isRun} >{
            isRun ? 'get color' : 'current page not work'
        }</button>
        <div className="picker-outer">
            <div className="picker" style={{background: pickerRef.current}}></div>
            <div className="picker-text">{pickerRef.current}</div>
        </div>
    </div>
}