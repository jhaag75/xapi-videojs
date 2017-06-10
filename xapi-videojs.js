
// xAPI Statements Based on VideoJS Player Interactions

(function(ADL){
    
	var XAPIVideoJS = function(target, src, options) {
		var actor = JSON.parse(ADL.XAPIWrapper.lrs.actor);

	    // Global Variables
	    var sessionID = ADL.ruuid();
	        
	    // Load the VideoJS player
	    var myPlayer =  videojs(target);

		/***************************************************************************************/
		/***** VIDEO.JS Player On Ready Event | xAPI Initialized Statement ********************/
		/*************************************************************************************/    
		    
	    // myPlayer object is defined, so It is ready to listen events
	    myPlayer.on("ready",function(){
	        
	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();

	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

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
	        //alert ("Playback Size:" + playbackSize);
	        
	         // get the playback rate of the video
	        var playbackRate = myPlayer.playbackRate();
	        //alert ("Playback Rate:" + playbackRate);
	        
	        
	        // Get all text tracks for the current player to determine if there are any CC-Subtitles
	        var tracks = myPlayer.textTracks();

	        for (var i = 0; i < tracks.length; i++) {
	          var track = tracks[i];

	          // Find the English captions track and mark it as "showing".
	          if (track.kind === 'captions' || track.kind === 'subtitles' && track.language === 'en') {
	            track.mode = 'showing';
	          }
	          // If it is showing it is enabled
	          if (track.mode ==='showing') {
	              var ccEnabled = true;
	              var ccLanguage = track.language;
	          } 
	              
	        }
	        // get user agent header string 
	        var userAgent = navigator.userAgent.toString();
	        //alert(userAgent);

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
	        //send initialized statement to the LRS    
	        ADL.XAPIWrapper.sendStatement(initializedStmt, function(resp, obj){   
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("initialized statement sent");
	    });
		    
		/***************************************************************************************/
		/***** VIDEO.JS Played Event | xAPI Played Statement **********************************/
		/*************************************************************************************/
		    
	    myPlayer.on("play",function(){
	        // get the current date and time and throw it into a variable for xAPI timestamp        
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();
	        
	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();
	        
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
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }
	            },
	            "timestamp": timeStamp
	        };

	        //send played statement to the LRS    
	        ADL.XAPIWrapper.sendStatement(playedStmt, function(resp, obj){
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("played statement sent");            
	    });    
		    
		/***************************************************************************************/
		/***** VIDEO.JS Paused Event | xAPI Paused Statement **********************************/
		/*************************************************************************************/    
		    
	    myPlayer.on("pause",function(){
	        // get the current date and time and throw it into a variable for xAPI timestamp        
	        var dateTime = new Date();
	        var timeStamp = dateTime.toISOString();
	        
	        // get the current time position in the video
	        var resultExtTime = formatFloat(myPlayer.currentTime());

	        // VideoJs suppors alternate video formats, so get exact URL for the xAPI Activity Object ID
	        var objectID = myPlayer.currentSrc().toString();
	        
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
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }                
	            },
	            "timestamp": timeStamp 
	        };
	        //send paused statement to the LRS    
	        ADL.XAPIWrapper.sendStatement(pausedStmt, function(resp, obj){
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("paused statement sent");            
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
	                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

	                }               
	            },
	            "timestamp": timeStamp 
	        };
	        //send completed statement to the LRS    
	        ADL.XAPIWrapper.sendStatement(completedStmt, function(resp, obj){
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("completed statement sent");            
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
	     
	        myPlayer.on("seeked", function() {
	            console.log("seeked from", seekStart, "to", currentTime, "; delta:", currentTime - previousTime);
	            
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
	        ADL.XAPIWrapper.sendStatement(seekedStmt, function(resp, obj){
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("seeked statement sent");            
	    });             

		/***************************************************************************************/
		/***** VIDEO.JS VolumeChange Event | xAPI Interacted Statement ************************/
		/*************************************************************************************/
		    
		myPlayer.on("volumechange",function(){
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
	            console.log(volumeChange);
	     
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
	        ADL.XAPIWrapper.sendStatement(volChangeStmt, function(resp, obj){
	        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
	        console.log("interacted volumeChange statement sent");            
	    }); 

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
		        ADL.XAPIWrapper.sendStatement(fullScreenTrueStmt, function(resp, obj){
		        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
		        console.log("interacted statement (fullScreen true) sent"); 
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
		        ADL.XAPIWrapper.sendStatement(fullScreenFalseStmt, function(resp, obj){
		        console.log("[" + obj.id + "]: " + resp.status + " - " + resp.statusText);});
		        console.log("interacted statement (fullscreen false) sent");    
		    }         
		}); 
	}
	function formatFloat(number) {
		if(number == null)
			return null;

		return +(parseFloat(number).toFixed(3));
	}
	ADL.XAPIVideoJS = XAPIVideoJS;
}(window.ADL = window.ADL || {}));
