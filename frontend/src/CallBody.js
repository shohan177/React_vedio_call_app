import React, { useEffect, useRef, useState } from "react"

import Peer from "simple-peer"
import io from "socket.io-client"



const socket = io.connect('http://localhost:5000')

const CallBody = () => {
    const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
			
				userVideo.current.srcObject = stream
			
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}
    return (
        <>
            <div className="container">
                <div className="card my-5 shadow p-4">
                    <div className="row">
                        <div className="col-7 bg-warning p-5">
                            <div className="row" style={{ height: "400px" }}>
                
                                {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
                                {callAccepted && !callEnded ?
                                <video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
                                null}
                            </div>
                            <div className="row">

                            {callAccepted && !callEnded ? (
                                <a  class="btn btn-secondary btn-danger ml-5" onClick={leaveCall}>
                                    End Call
                                </a>
                                ) : null}
                                
                                {receivingCall && !callAccepted ? (
                                <div className="caller">
                                    <h1 >{name} is calling...</h1>
                                    <a  class="btn btn-secondary btn-danger ml-5" onClick={answerCall}>
                                        Answer
                                    </a>
                                </div>
                                ) : null}

                            </div>
                        </div>
                        <div className="col-5 overflow-auto" style={{ height: "500px" }}>
                            <div class="list-group">

                                <div class="list-group-item mt-2 border border-warning round">
                                    <div className="row pt-2">
                                        <div className="col-6">
                                            <p>Sarwar Jahan Shohan</p>
                                        </div>
                                        <div className="col-3">
                                            <span className="text-success">Active</span>
                                        </div>
                                        <div className="col-3">
                                            <a href="#" className="btn btn-success btn-sm">CALL</a>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default CallBody
