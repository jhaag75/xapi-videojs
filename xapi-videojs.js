
// xAPI Statements Based on VideoJS Player Interactions

(function(ADL){

	var XAPIVideoJS = function(target, src, options) {
		var actor = JSON.parse(ADL.XAPIWrapper.lrs.actor);

	    // Global Variables & common functions
	    var myPlayer =  videojs(target);
	    var sessionID = ADL.ruuid();
        var skipPlayEvent = false;       
    	var sendCCSubtitle = false;
    	var volumeSliderActive = false;

        // Get all text tracks for the current player to determine if there are any CC-Subtitles
        var tracks = myPlayer.textTracks();

        var timerangePropertyNames = ['buffered', 'seekable', 'played'];
        // this function can be used for seeked, played, or buffered events from videoJS
        var timeRangesToString = function timeRangesToString(tr) {
          var arr = [];

          for (var i = 0; i < tr.length; i++) {
            arr.push(tr.start(i).toFixed(3) + '[.]' + tr.end(i).toFixed(3));
          }

          return arr;
        };
        
        // common math functions
        function formatFloat(number) {
            if(number == null)
                return null;

            return +(parseFloat(number).toFixed(3));
        }    

		/***************************************************************************************/
		/***** VIDEO.JS Player On Ready Event | xAPI Initialized Statement ********************/
		/*************************************************************************************/

	    // myPlayer object is defined, so It is ready to listen events
	    myPlayer.on("ready",function(){

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();

	        // get the current date and time and throw it into a variable for xAPI timestamp
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();

	        // check to see if the player is in fullscreen mode
	        var fullScreenOrNot = myPlayer.isFullscreen();

	        // get the current screen size
	        var screenSize = "";
	        screenSize += screen.width + "x" + screen.height;

	        // get the playback size of the video
	        var playbackSize = "";
	        playbackSize += myPlayer.width() + "x" + myPlayer.height();


	         // get the playback rate of the video
	        var playbackRate = myPlayer.playbackRate();


	        //Enable Captions/Subtitles
	        for (var i = 0; i < tracks.length; i++) {
	          var track = tracks[i];

	          // If captions and subtitles are enabled mark track mode as "showing".
	          if (track.kind === 'captions' || track.kind === 'subtitles') {
	            track.mode = 'showing';
	          }
	          // If it is showing then CC is enabled and determine the language
	          if (track.mode ==='showing') {
	              var ccEnabled = true;
	              var ccLanguage = track.language;
	          }
	        }
	        // get user agent header string
	        var userAgent = navigator.userAgent.toString();


	        // get user volume
	        var volume = formatFloat(myPlayer.volume());

	        // prepare the xAPI initialized statement
	        var initializedStmt =
	        {
	        	"id": sessionID,
	            "actor": actor,
	            "verb": {
	                "id": "http://adlnet.gov/expapi/verbs/initialized",
	                "display": {
	                    "en-US": "initialized"
	                }
	            },
	            "object": {
	                "id": objectID,
	                "definition": {
	                    "name": {
	                        "en-US": "Ocean Life"
	                    },
	                    "description": {
	                        "en-US": "Video of ocean life."
	                    },
	                    "type": "https://w3id.org/xapi/video/activity-type/video"
	                },
	                "objectType": "Activity"
	            },
	            "context": {
	                "contextActivities": {
	                    "category": [
	                       {
	                          "id": "https://w3id.org/xapi/video"
	                       }
	                    ]
	                },
	                "extensions": {
	                        "https://w3id.org/xapi/video/extensions/full-screen": fullScreenOrNot,
	                        "https://w3id.org/xapi/video/extensions/screen-size": screenSize,
	                        "https://w3id.org/xapi/video/extensions/video-playback-size": playbackSize,
	                        "https://w3id.org/xapi/video/extensions/cc-enabled": ccEnabled,
	                        "https://w3id.org/xapi/video/extensions/cc-subtitle-lang": ccLanguage,
	                        "https://w3id.org/xapi/video/extensions/speed": playbackRate + "x",
	                        "https://w3id.org/xapi/video/extensions/user-agent": userAgent,
	                        "https://w3id.org/xapi/video/extensions/volume": volume,
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }
	            },
	            "timestamp": timeStamp
	        };
	        //send initialized statement to the LRS & show data in console
            console.log("initialized statement sent");
	        ADL.XAPIWrapper.sendStatement(initializedStmt, function(resp, obj){
	        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
            console.log(initializedStmt);
	    });

		/***************************************************************************************/
		/***** VIDEO.JS CC-Subtitle Track Change Event | xAPI Interacted Statement **********************************/
		/*************************************************************************************/

        tracks.addEventListener("change", function(e) {
    		sendCCSubtitle = true; //Set Flag to sendCCSubtitle change statement. 

        	setTimeout(function() { //Add a delay of 20 milliseconds so intermediate change events generated by VideoJS are not sent

        		if(sendCCSubtitle) {
	    			console.log("sendCCSubtitle: " + sendCCSubtitle);
	        		sendCCSubtitle = false;

			        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
			        var objectID = myPlayer.currentSrc().toString();

			        // get the current date and time and throw it into a variable for xAPI timestamp
			        var dateTime = new Date();
			        var timeStamp = dateTime.toISOString();

			        // get the current time position in the video
			        var resultExtTime = formatFloat(myPlayer.currentTime());

			        //Captions/Subtitles values
			        for (var i = 0; i < tracks.length; i++) {
			          var track = tracks[i];

			          // If it is showing then CC is enabled and determine the language
			          if (track.mode === 'showing') {
			              var ccEnabled = true;
			              var ccLanguage = track.language;
			          }
			        }

			        // prepare the xAPI interacted statement
			        var interactedStatement =
			        {
			            "actor": actor,
			            "verb": {
			                "id": "http://adlnet.gov/expapi/verbs/interacted",
			                "display": {
			                    "en-US": "interacted"
			                }
			            },
			            "object": {
			                "id": objectID,
			                "definition": {
			                    "name": {
			                        "en-US": "Ocean Life"
			                    },
			                    "description": {
			                        "en-US": "Video of ocean life."
			                    },
			                    "type": "https://w3id.org/xapi/video/activity-type/video"
			                },
			                "objectType": "Activity"
			            },
			            "result": {
			                "extensions": {
			                    "https://w3id.org/xapi/video/extensions/time": resultExtTime
			                }
			            },
			            "context": {
			                "contextActivities": {
			                    "category": [
			                       {
			                          "id": "https://w3id.org/xapi/video"
			                       }
			                    ]
			                },
			                "extensions": {
    	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
		                        "https://w3id.org/xapi/video/extensions/cc-enabled": ccEnabled,
		                        "https://w3id.org/xapi/video/extensions/cc-subtitle-lang": ccLanguage,
			                }
			            },
			            "timestamp": timeStamp
			        };

			        //send CC-Subtitle change statement to the LRS
			        console.log("interacted statement (CC-Subtitle change) sent");
			        ADL.XAPIWrapper.sendStatement(interactedStatement, function(resp, obj){
			        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
		            console.log(interactedStatement);  
            	}
        	}, 20);
        });

		/***************************************************************************************/
		/***** VIDEO.JS Played Event | xAPI Played Statement **********************************/
		/*************************************************************************************/

	    myPlayer.on("play",function(){
          // If user is seaking, skip the play event
          if (skipPlayEvent !== true) {
              
              // get the current date and time and throw it into a variable for xAPI timestamp
    	        var dateTime = new Date();
    	        var timeStamp = dateTime.toISOString();

    	        // get the current time position in the video
    	        var resultExtTime = formatFloat(myPlayer.currentTime());

    	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
    	        var objectID = myPlayer.currentSrc().toString();
              
                // get played segments of video from timeRange object and store in variable
                var playedSegments = timeRangesToString(myPlayer.tech(true).played());
                console.log("played segments:" + playedSegments);

    	        var playedStmt =
    	        {
    	            "actor": actor,
    	            "verb": {
    	                "id": "https://w3id.org/xapi/video/verbs/played",
    	                "display": {
    	                    "en-US": "played"
    	                }
    	            },
    	            "object": {
    	                "id": objectID,
    	                "definition": {
    	                    "name": {
    	                        "en-US": "Ocean Life"
    	                    },
    	                    "description": {
    	                        "en-US": "Video of ocean life."
    	                    },
    	                    "type": "https://w3id.org/xapi/video/activity-type/video"
    	                },
    	                "objectType": "Activity"
    	            },
    	            "result": {
    	                "extensions": {
    	                    "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                            "https://w3id.org/xapi/video/extensions/played-segments": playedSegments
    	                }
    	            },
    	            "context": {
    	                "contextActivities": {
    	                    "category": [
    	                       {
    	                          "id": "https://w3id.org/xapi/video"
    	                       }
    	                    ]
    	                },
    	                "extensions": {
    	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

    	                }
    	            },
    	            "timestamp": timeStamp
    	        };

    	        //send played statement to the LRS
    	        console.log("played statement sent");
                ADL.XAPIWrapper.sendStatement(playedStmt, function(resp, obj){
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
                console.log(playedStmt);              
          } else {
              // Seek statement has been sent, resume play events
              skipPlayEvent = false;
              send_seeked();
          }
	    });

		/***************************************************************************************/
		/***** VIDEO.JS Paused Event | xAPI Paused Statement **********************************/
		/*************************************************************************************/

	    myPlayer.on("pause",function(){
          // If the user is seeking, do not send the pause event
          if (this.seeking() === false)
          {
    	        // get the current date and time and throw it into a variable for xAPI timestamp
    	        var dateTime = new Date();
    	        var timeStamp = dateTime.toISOString();

    	        // get the current time position in the video
    	        var resultExtTime = formatFloat(myPlayer.currentTime());
                

    	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
    	        var objectID = myPlayer.currentSrc().toString();

                // get the progress percentage and put it in a variable called percentProgress
                currentTime = myPlayer.currentTime();
                duration = myPlayer.duration();
                var percentTime = (currentTime / duration );
                var percentProgress = percentTime.toPrecision(1);
                console.log("video progress percentage:" + percentProgress +".");
              
                // get played segments of video from timeRange object and store in variable
                var playedSegments = timeRangesToString(myPlayer.tech(true).played());
                console.log("played segments:" + playedSegments);              

              
    	        var pausedStmt =
    	        {
    	            "actor": actor,
    	            "verb": {
    	                "id": "https://w3id.org/xapi/video/verbs/paused",
    	                "display": {
    	                    "en-US": "paused"
    	                }
    	            },
    	            "object": {
    	                "id": objectID,
    	                "definition": {
    	                    "name": {
    	                        "en-US": "Ocean Life"
    	                    },
    	                    "description": {
    	                        "en-US": "Video of ocean life."
    	                    },
    	                    "type": "https://w3id.org/xapi/video/activity-type/video"
    	                },
    	                "objectType": "Activity"
    	            },
    	            "result": {
    	                "extensions": {
    	                    "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                            "https://w3id.org/xapi/video/extensions/progress": percentProgress,
                            "https://w3id.org/xapi/video/extensions/played-segments": playedSegments
    	                }
    	            },
    	            "context": {
    	                "contextActivities": {
    	                    "category": [
    	                       {
    	                          "id": "https://w3id.org/xapi/video"
    	                       }
    	                    ]
    	                },
    	                "extensions": {
    	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

    	                }
    	            },
    	            "timestamp": timeStamp
    	        };
    	        //send paused statement to the LRS
    	        console.log("paused statement sent");
                ADL.XAPIWrapper.sendStatement(pausedStmt, function(resp, obj){
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
                console.log(pausedStmt);
          } else {
              //skip subsequent play Event
              skipPlayEvent = true;
          }
	    });


		/***************************************************************************************/
		/***** VIDEO.JS Ended Event | xAPI Completed Statement **********************************/
		/*************************************************************************************/

		myPlayer.on("ended",function(){
            
            
	        // get the current date and time and throw it into a variable for xAPI timestamp
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();

	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

            // get the progress percentage and put it in a variable called percentProgress
            currentTime = myPlayer.currentTime();
            duration = myPlayer.duration();
            var percentTime = (currentTime / duration );
            var percentProgress = percentTime.toPrecision(1);
            console.log("video progress percentage:" + percentProgress +".");            

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();

	        var completedStmt =
	        {
	            "actor": actor,
	            "verb": {
	                "id": "http://adlnet.gov/expapi/verbs/completed",
	                "display": {
	                    "en-US": "completed"
	                }
	            },
	            "object": {
	                "id": objectID,
	                "definition": {
	                    "name": {
	                        "en-US": "Ocean Life"
	                    },
	                    "description": {
	                        "en-US": "Video of ocean life."
	                    },
	                    "type": "https://w3id.org/xapi/video/activity-type/video"
	                },
	                "objectType": "Activity"
	            },
	            "result": {
	                "extensions": {
	                    "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                        "https://w3id.org/xapi/video/extensions/progress": percentProgress
	                }
	            },
	            "context": {
	                "contextActivities": {
	                    "category": [
	                       {
	                          "id": "https://w3id.org/xapi/video"
	                       }
	                    ]
	                },
	                "extensions": {
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }
	            },
	            "timestamp": timeStamp
	        };
	        //send completed statement to the LRS
	        console.log("completed statement sent");
	        ADL.XAPIWrapper.sendStatement(completedStmt, function(resp, obj){
	        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
            console.log(completedStmt);            
            // create a modal window for the user to terminate the session and dispose of the player
            terminateModal();
	    });

		/***************************************************************************************/
		/***** VIDEO.JS  Seekable Event | xAPI Seeked Statement *******************************/
		/*************************************************************************************/


	     // get seekable start & end points
	        var previousTime = 0;
	        var currentTime = 0;
	        var seekStart = null;

	        myPlayer.on("timeupdate", function() {
	            previousTime = currentTime;
	            currentTime = formatFloat(myPlayer.currentTime());
	        });

	        myPlayer.on("seeking", function() {
	            if(seekStart === null) {
	                seekStart = previousTime;
	            }
	        });
            
        
	   function send_seeked() {
	       
           console.log("seeked:" + seekStart + "[.]" +currentTime);
                
	        // get the current date and time and throw it into a variable for xAPI timestamp
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();

	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();

	        var seekedStmt =
	        {
	            "actor": actor,
	            "verb": {
	                "id": "https://w3id.org/xapi/video/verbs/seeked",
	                "display": {
	                    "en-US": "seeked"
	                }
	            },
	            "object": {
	                "id": objectID,
	                "definition": {
	                    "name": {
	                        "en-US": "Ocean Life"
	                    },
	                    "description": {
	                        "en-US": "Video of ocean life."
	                    },
	                    "type": "https://w3id.org/xapi/video/activity-type/video"
	                },
	                "objectType": "Activity"
	            },
	            "result": {
	                "extensions": {
	                    "https://w3id.org/xapi/video/extensions/time-from": seekStart,
	                    "https://w3id.org/xapi/video/extensions/time-to": currentTime
	                }
	            },
	            "context": {
	                "contextActivities": {
	                    "category": [
	                       {
	                          "id": "https://w3id.org/xapi/video"
	                       }
	                    ]
	                },
	                "extensions": {
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }
	            },
	            "timestamp": timeStamp
	        };
	        //send seeked statement to the LRS
	        console.log("seeked statement sent");
   	        ADL.XAPIWrapper.sendStatement(seekedStmt, function(resp, obj){
	        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
            console.log(seekedStmt);     
	    }


		/***************************************************************************************/
		/***** VIDEO.JS Modal Close Event | xAPI Terminated Statement ************************/
		/*************************************************************************************/
       
        function terminateModal() {
           
            var modal = myPlayer.createModal('The video has ended. Click the close button to exit.');
            modal.on('modalclose', function() {
                TerminateMyPlayer();
            });
            
        }
    

        function TerminateMyPlayer() {
 
	        // get the current date and time and throw it into a variable for xAPI timestamp
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();

	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());
            
            // get the progress percentage and put it in a variable called percentProgress
            currentTime = myPlayer.currentTime();
            duration = myPlayer.duration();
            var percentTime = (currentTime / duration );
            var percentProgress = percentTime.toPrecision(1);
            console.log("video progress percentage:" + percentProgress +".");            

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();
            
            
	        var terminatedStmt =
	        {
	            "actor": actor,
	            "verb": {
	                "id": "http://adlnet.gov/expapi/verbs/terminated",
	                "display": {
	                    "en-US": "terminated"
	                }
	            },
	            "object": {
	                "id": objectID,
	                "definition": {
	                    "name": {
	                        "en-US": "Ocean Life"
	                    },
	                    "description": {
	                        "en-US": "Video of ocean life."
	                    },
	                    "type": "https://w3id.org/xapi/video/activity-type/video"
	                },
	                "objectType": "Activity"
	            },
	            "result": {
	                "extensions": {
	                    "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                        "https://w3id.org/xapi/video/extensions/progress": percentProgress
	                }
	            },
	            "context": {
	                "contextActivities": {
	                    "category": [
	                       {
	                          "id": "https://w3id.org/xapi/video"
	                       }
	                    ]
	                },
	                "extensions": {
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }
	            },
	            "timestamp": timeStamp
	        };
            
	        //send completed statement to the LRS
	        console.log("terminated statement sent");
	        ADL.XAPIWrapper.sendStatement(terminatedStmt, function(resp, obj){
	        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
            console.log(terminatedStmt);            
            myPlayer.dispose();
	    };

		
        
		/***************************************************************************************/
		/***** VIDEO.JS VolumeChange Event | xAPI Interacted Statement ************************/
		/*************************************************************************************/
		myPlayer.controlBar.volumePanel.volumeControl.on("slideractive", function() {
			volumeSliderActive = true;
		});
		myPlayer.controlBar.volumePanel.volumeControl.on("sliderinactive", function() {
			console.log('event sliderinactive: send volume change statement');
			send_volumechange();
			volumeSliderActive = false;
		});
		myPlayer.on("volumechange",function() {
			if(!volumeSliderActive) {
				console.log('event volumechange (and volumeSliderActive is false): send volume change statement');
				send_volumechange();
			}
		});
		function send_volumechange() {
			// get the current date and time and throw it into a variable for xAPI timestamp
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();

	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();

	        // get user volume and return it as a percentage
	        var isMuted = myPlayer.muted();
            
	        if (isMuted === true) {
	            var volumeChange = 0;
	            }
	        if (isMuted === false) {
	           var volumeChange = formatFloat(myPlayer.volume());
	            }
            
	       console.log("volume changed to: " + volumeChange);

	        var volChangeStmt =
	        {
	            "actor": actor,
	            "verb": {
	                "id": "http://adlnet.gov/expapi/verbs/interacted",
	                "display": {
	                    "en-US": "interacted"
	                }
	            },
	            "object": {
	                "id": objectID,
	                "definition": {
	                    "name": {
	                        "en-US": "Ocean Life"
	                    },
	                    "description": {
	                        "en-US": "Video of ocean life."
	                    },
	                    "type": "https://w3id.org/xapi/video/activity-type/video"
	                },
	                "objectType": "Activity"
	            },
	            "result": {
	                "extensions": {
	                    "https://w3id.org/xapi/video/extensions/time": resultExtTime
	                }
	            },
	            "context": {
	                "contextActivities": {
	                    "category": [
	                       {
	                          "id": "https://w3id.org/xapi/video"
	                       }
	                    ]
	                },
	                "extensions": {
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
	                        "https://w3id.org/xapi/video/extensions/volume": volumeChange

	                }
	            },
	            "timestamp": timeStamp
	        };
	        //send volume change statement to the LRS
	        console.log("interacted statement (volume change) sent");
	        ADL.XAPIWrapper.sendStatement(volChangeStmt, function(resp, obj){
	        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
            console.log(volChangeStmt);            
	    }

		/***************************************************************************************/
		/***** VIDEO.JS Fullscreen Event | xAPI Interacted Statement **************************/
		/*************************************************************************************/

		myPlayer.on("fullscreenchange",function(){

		    // check to see if the player is in fullscreen mode
		    var fullScreenOrNot = myPlayer.isFullscreen();
		    // console.log("full screen:" + fullScreenOrNot);

		    // if full screen true, then send an interacted statement
		    if (fullScreenOrNot === true) {

		        // get the current date and time and throw it into a variable for xAPI timestamp
		        var dateTime = new Date();
		        var timeStamp = dateTime.toISOString();

		        // get the current time position in the video
		        var resultExtTime = formatFloat(myPlayer.currentTime());

		        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
		        var objectID = myPlayer.currentSrc().toString();

		        // get the current screen size
		        var screenSize = "";
		        screenSize += screen.width + "x" + screen.height;

		        // get the playback size of the video
		        var playbackSize = "";
		        playbackSize += myPlayer.width() + "x" + myPlayer.height();
		        //alert ("Playback Size:" + playbackSize);

		        var fullScreenTrueStmt =
		        {
		            "actor": actor,
		            "verb": {
		                "id": "http://adlnet.gov/expapi/verbs/interacted",
		                "display": {
		                    "en-US": "interacted"
		                }
		            },
		            "object": {
		                "id": objectID,
		                "definition": {
		                    "name": {
		                        "en-US": "Ocean Life"
		                    },
		                    "description": {
		                        "en-US": "Video of ocean life."
		                    },
		                    "type": "https://w3id.org/xapi/video/activity-type/video"
		                },
		                "objectType": "Activity"
		            },
		            "result": {
		                "extensions": {
		                    "https://w3id.org/xapi/video/extensions/time": resultExtTime
		                }
		            },
		            "context": {
		                "contextActivities": {
		                    "category": [
		                       {
		                          "id": "https://w3id.org/xapi/video"
		                       }
		                    ]
		                },
		                "extensions": {
		                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
		                        "https://w3id.org/xapi/video/extensions/full-screen": fullScreenOrNot,
		                        "https://w3id.org/xapi/video/extensions/screen-size": screenSize,
		                        "https://w3id.org/xapi/video/extensions/video-playback-size": playbackSize

		                }
		            },
		            "timestamp": timeStamp
		        };
		        //send full screen statement to the LRS
		        console.log("interacted statement (fullScreen true) sent");
                ADL.XAPIWrapper.sendStatement(fullScreenTrueStmt, function(resp, obj){
	            console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
                console.log(fullScreenTrueStmt);
		    }

		     // if fullScreen is false then send a different interacted statement
		    if (fullScreenOrNot === false) {

		        // get the current date and time and throw it into a variable for xAPI timestamp
		        var dateTime = new Date();
		        var timeStamp = dateTime.toISOString();

		        // get the current time position in the video
		        var resultExtTime = formatFloat(myPlayer.currentTime());

		        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
		        var objectID = myPlayer.currentSrc().toString();

		        // get the current screen size
		        var screenSize = "";
		        screenSize += screen.width + "x" + screen.height;

		        // get the playback size of the video
		        var playbackSize = "";
		        playbackSize += myPlayer.width() + "x" + myPlayer.height();
		        //alert ("Playback Size:" + playbackSize);

		        var fullScreenFalseStmt =
		        {
		            "actor": actor,
		            "verb": {
		                "id": "http://adlnet.gov/expapi/verbs/interacted",
		                "display": {
		                    "en-US": "interacted"
		                }
		            },
		            "object": {
		                "id": objectID,
		                "definition": {
		                    "name": {
		                        "en-US": "Ocean Life"
		                    },
		                    "description": {
		                        "en-US": "Video of ocean life."
		                    },
		                    "type": "https://w3id.org/xapi/video/activity-type/video"
		                },
		                "objectType": "Activity"
		            },
		            "result": {
		                "extensions": {
		                    "https://w3id.org/xapi/video/extensions/time": resultExtTime
		                }
		            },
		            "context": {
		                "contextActivities": {
		                    "category": [
		                       {
		                          "id": "https://w3id.org/xapi/video"
		                       }
		                    ]
		                },
		                "extensions": {
		                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
		                        "https://w3id.org/xapi/video/extensions/full-screen": fullScreenOrNot,
		                        "https://w3id.org/xapi/video/extensions/screen-size": screenSize,
		                        "https://w3id.org/xapi/video/extensions/video-playback-size": playbackSize

		                }
		            },
		            "timestamp": timeStamp
		        };
		        //send exit full screen statement to the LRS
		        console.log("interacted statement (fullscreen false) sent");
                ADL.XAPIWrapper.sendStatement(fullScreenFalseStmt, function(resp, obj){
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);});
                console.log(fullScreenFalseStmt);                
		    }
		});
	}
    

	ADL.XAPIVideoJS = XAPIVideoJS;
}(window.ADL = window.ADL || {}));

