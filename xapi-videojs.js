// xAPI Statements Based on VideoJS Player Interactions

(function (ADL) {

    var XAPIVideoJS = function (target, src, options) {
        var actor = JSON.parse(ADL.XAPIWrapper.lrs.actor);

        // Global Variables & common functions
        var myPlayer = videojs(target);
        var objectID = myPlayer.currentSrc().toString();
        var sessionID = ADL.ruuid();
        var skipPlayEvent = false;
        var sendCCSubtitle = false;
        var volumeSliderActive = false;
        var played_segments = "";
        var played_segments_segment_start = null;
        var played_segments_segment_end = null;
        var started = false;
        var ccEnabled = false;
        var ccLanguage = "";

        // Get all text tracks for the current player to determine if there are any CC-Subtitles
        var tracks = myPlayer.textTracks();

        // common math functions
        function formatFloat(number) {
            if (number == null)
                return null;

            return +(parseFloat(number).toFixed(3));
        }
        
        function add_registration_if_exists(statement) {
            if (typeof ADL.XAPIWrapper.lrs.registration == "string" && ADL.XAPIWrapper.lrs.registration.length == 36) {
               // var registration = ADL.XAPIWrapper.lrs.registration;
               if(typeof statement["context"] == undefined)
                    statement["context"] = new Object();

                statement["context"]["registration"] = ADL.XAPIWrapper.lrs.registration;
            }

            return statement;
        }

        // other functions
        function start_played_segment(start_time) {
            played_segments_segment_start = start_time;
        }

        function end_played_segment(end_time) {
            var arr;
            arr = (played_segments == "") ? [] : played_segments.split("[,]");
            arr.push(played_segments_segment_start + "[.]" + end_time);
            played_segments = arr.join("[,]");
            played_segments_segment_end = end_time;
            played_segments_segment_start = null;
        }

        function fixed_play_time(time) {
            if (played_segments_segment_end == null || Math.abs(played_segments_segment_end - time) >= 1)
                return time;
            else
                return played_segments_segment_end;
        }

        function get_progress() {
            var arr, arr2;

            //get played segments array
            arr = (played_segments == "") ? [] : played_segments.split("[,]");
            if (played_segments_segment_start != null) {
                arr.push(played_segments_segment_start + "[.]" + formatFloat(myPlayer.currentTime()));
            }

            arr2 = [];
            arr.forEach(function (v, i) {
                arr2[i] = v.split("[.]");
                arr2[i][0] *= 1;
                arr2[i][1] *= 1;
            });

            //sort the array
            arr2.sort(function (a, b) {
                return a[0] - b[0];
            });

            //normalize the segments
            arr2.forEach(function (v, i) {
                if (i > 0) {
                    if (arr2[i][0] < arr2[i - 1][1]) { //overlapping segments: this segment's starting point is less than last segment's end point.
                        //console.log(arr2[i][0] + " < " + arr2[i-1][1] + " : " + arr2[i][0] +" = " +arr2[i-1][1] );
                        arr2[i][0] = arr2[i - 1][1];
                        if (arr2[i][0] > arr2[i][1])
                            arr2[i][1] = arr2[i][0];
                    }
                }
            });

            //calculate progress_length
            var progress_length = 0;
            arr2.forEach(function (v, i) {
                if (v[1] > v[0])
                    progress_length += v[1] - v[0];
            });

            var progress = 1 * (progress_length / myPlayer.duration()).toFixed(2);
            return progress;
        }

        function calculate_duration() {
            var arr, arr2;

            //get played segments array
            arr = (played_segments == "") ? [] : played_segments.split("[,]");
            if (played_segments_segment_start != null) {
                arr.push(played_segments_segment_start + "[.]" + formatFloat(myPlayer.currentTime()));
            }

            arr2 = [];
            var duration = 0;
            arr.forEach(function (v, i) {
                arr2[i] = v.split("[.]");
                arr2[i][0] *= 1;
                arr2[i][1] *= 1;

                if(arr2[i][1] > arr2[i][0])
                    duration += arr2[i][1] - arr2[i][0];
            });

            return duration;
        }

        var terminate_player = false;

        function video_start() {
            started = true;
            var myparams = [];
            myparams['agent'] = JSON.stringify(actor);
            myparams['activity'] = objectID;
            myparams['verb'] = 'https://w3id.org/xapi/video/verbs/paused';
            myparams['limit'] = 1;

            if (typeof ADL.XAPIWrapper.lrs.registration == "string" && ADL.XAPIWrapper.lrs.registration.length == 36) {
//                console.log('yes there is a registration in xAPIWrapper');
                myparams['registration'] = ADL.XAPIWrapper.lrs.registration;
            }
            
            ret = ADL.XAPIWrapper.getStatements(myparams);
            if (ret != undefined &&
                ret.statements != undefined &&
                ret.statements[0] != undefined &&
                ret.statements[0]['result'] != undefined &&
                ret.statements[0]['result']['extensions'] != undefined &&
                ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/played-segments'] != undefined
            ) {
                console.log(played_segments);
                played_segments = ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/played-segments'];
                console.log(played_segments);
            }
            if (ret != undefined &&
                ret.statements != undefined &&
                ret.statements[0] != undefined &&
                ret.statements[0]['result'] != undefined &&
                ret.statements[0]['result']['extensions'] != undefined &&
                ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/time'] != undefined
            ) {
                var time = 1 * ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/time'];
                if (time > 0)
                    myPlayer.currentTime(time);
                console.log(time);
            }
            if (ret != undefined &&
                ret.statements != undefined &&
                ret.statements[0] != undefined &&
                ret.statements[0]['result'] != undefined &&
                ret.statements[0]['result']['extensions'] != undefined &&
                ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/progress'] != undefined
            ) {
                var progress = 1 * ret.statements[0]['result']['extensions']['https://w3id.org/xapi/video/extensions/progress'];
                if (progress == 1)
                {
                    completion_sent = true;
                    console.log(progress);
                }
            }


            send_initialized();

            window.addEventListener("beforeunload", function (e) {
                terminate_player = true;
                if (myPlayer.paused())
                    TerminateMyPlayer();
                else
                    myPlayer.pause();
            });
        }

        /***************************************************************************************/
        /***** VIDEO.JS Player xAPI Initialized Statement ********************/
        /*************************************************************************************/

        function send_initialized() {
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
            playbackSize += myPlayer.currentWidth() + "x" + myPlayer.currentHeight();

            // get the playback rate of the video
            var playbackRate = myPlayer.playbackRate();
            
            // vet the video length
            var length = myPlayer.duration();

            var ccEnabled = false;
            var ccLanguage = "";
            
            //Enable Captions/Subtitles
            for (var i = 0; i < tracks.length; i++) {
                var track = tracks[i];

                // If it is showing then CC is enabled and determine the language
                if (track.mode === 'showing') {
                    var ccEnabled = true;
                    var ccLanguage = track.language;
                } 
            }
            // get user agent header string
            var userAgent = navigator.userAgent.toString();

            // get user volume
            var volume = formatFloat(myPlayer.volume());

            // get quality
            // var quality = (myPlayer.videoHeight() < myPlayer.videoWidth())? myPlayer.videoHeight():videoWidth();/
            // console.log("quality is:" + quality);

            // prepare the xAPI initialized statement
            var initializedStmt = {
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
                            "en-US": activityTitle
                        },
                        "description": {
                            "en-US": activityDesc
                        },
                        "type": "https://w3id.org/xapi/video/activity-type/video"
                    },
                    "objectType": "Activity"
                },
                "context": {
                    "contextActivities": {
                        "category": [{
                            "id": "https://w3id.org/xapi/video"
                        }]
                    },
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/completion-threshold": "1.0",
                        "https://w3id.org/xapi/video/extensions/length": length,
                        "https://w3id.org/xapi/video/extensions/full-screen": fullScreenOrNot,
                        "https://w3id.org/xapi/video/extensions/screen-size": screenSize,
                        "https://w3id.org/xapi/video/extensions/video-playback-size": playbackSize,
                        "https://w3id.org/xapi/video/extensions/cc-enabled": ccEnabled,
                        "https://w3id.org/xapi/video/extensions/speed": playbackRate + "x",
                        "https://w3id.org/xapi/video/extensions/frame-rate": "23.98",
                        "https://w3id.org/xapi/video/extensions/quality": "960x400",
                        "https://w3id.org/xapi/video/extensions/user-agent": userAgent,
                        "https://w3id.org/xapi/video/extensions/volume": volume,
                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

                    }
                },
                "timestamp": timeStamp
            };

            if(ccEnabled == true) {
                initializedStmt["context"]["extensions"]["https://w3id.org/xapi/video/extensions/cc-subtitle-lang"] = ccLanguage; //Add Language extention only when ccEnabled
            }

            initializedStmt = add_registration_if_exists(initializedStmt);
            //send initialized statement to the LRS & show data in console
            console.log("initialized statement sent");
            ADL.XAPIWrapper.sendStatement(initializedStmt, function (resp, obj) {
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
            });
            console.log(initializedStmt);
        }

        /***************************************************************************************/
        /***** VIDEO.JS CC-Subtitle Track Change Event | xAPI Interacted Statement **********************************/
        /*************************************************************************************/

        tracks.addEventListener("change", function (e) {
            sendCCSubtitle = true; //Set Flag to sendCCSubtitle change statement. 

            setTimeout(function () { //Add a delay of 20 milliseconds so intermediate change events generated by VideoJS are not sent

                if (sendCCSubtitle) {
                    console.log("sendCCSubtitle: " + sendCCSubtitle);
                    sendCCSubtitle = false;
                    ccEnabled = false;
                    ccLanguage = "";
                    

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
                    var interactedStatement = {
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
                                    "en-US": activityTitle
                                },
                                "description": {
                                    "en-US": activityDesc
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
                                "category": [{
                                    "id": "https://w3id.org/xapi/video"
                                }]
                            },
                            "extensions": {
                                "https://w3id.org/xapi/video/extensions/session-id": sessionID,
                                "https://w3id.org/xapi/video/extensions/cc-enabled": ccEnabled,
                                "https://w3id.org/xapi/video/extensions/cc-subtitle-lang": ccLanguage,
                            }
                        },
                        "timestamp": timeStamp
                    };

                    interactedStatement = add_registration_if_exists(interactedStatement);
                    //send CC-Subtitle change statement to the LRS
                    console.log("interacted statement (CC-Subtitle change) sent");
                    ADL.XAPIWrapper.sendStatement(interactedStatement, function (resp, obj) {
                        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
                    });
                    console.log(interactedStatement);
                }
            }, 20);
        });

        /***************************************************************************************/
        /***** VIDEO.JS Played Event | xAPI Played Statement **********************************/
        /*************************************************************************************/

        myPlayer.on("play", function () {
            //	myPlayer.currentTime(20);
            if (started == false) {
                video_start();
            }
            
            // vet the video length
            var length = myPlayer.duration();

            // If user is seaking, skip the play event
            if (skipPlayEvent !== true) {
                seekStart = null; //reset seek if not reset

                // get the current date and time and throw it into a variable for xAPI timestamp
                var dateTime = new Date();
                var timeStamp = dateTime.toISOString();

                // get the current time position in the video
                var resultExtTime = fixed_play_time(formatFloat(myPlayer.currentTime()));
                start_played_segment(resultExtTime);


                var playedStmt = {
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
                                "en-US": activityTitle
                            },
                            "description": {
                                "en-US": activityDesc
                            },
                            "type": "https://w3id.org/xapi/video/activity-type/video"
                        },
                        "objectType": "Activity"
                    },
                    "result": {
                        "extensions": {
                            "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                        }
                    },
                    "context": {
                        "contextActivities": {
                            "category": [{
                                "id": "https://w3id.org/xapi/video"
                            }]
                        },
                        "extensions": {
                            "https://w3id.org/xapi/video/extensions/length": length,
                            "https://w3id.org/xapi/video/extensions/session-id": sessionID

                        }
                    },
                    "timestamp": timeStamp
                };

                playedStmt = add_registration_if_exists(playedStmt);
                //send played statement to the LRS
                console.log("played statement sent");
                ADL.XAPIWrapper.sendStatement(playedStmt, function (resp, obj) {
                    console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
                });
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

        myPlayer.on("pause", function () {
            // If the user is seeking, do not send the pause event
            if (this.seeking() === false) {
                // get the current date and time and throw it into a variable for xAPI timestamp
                var dateTime = new Date();
                var timeStamp = dateTime.toISOString();
                
                // get the video length
                var length = myPlayer.duration();

                // get the current time position in the video
                var resultExtTime = formatFloat(myPlayer.currentTime());
                end_played_segment(resultExtTime);

                // get the progress percentage and put it in a variable called progress
                var progress = get_progress();
                console.log("video progress percentage:" + progress + ".");
            

                if (progress >= 1) {
                    send_completed();

                }
                    var pausedStmt = {
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
                                    "en-US": activityTitle
                                },
                                "description": {
                                    "en-US": activityDesc
                                },
                                "type": "https://w3id.org/xapi/video/activity-type/video"
                            },
                            "objectType": "Activity"
                        },
                        "result": {
                            "extensions": {
                                "https://w3id.org/xapi/video/extensions/time": resultExtTime,
                                "https://w3id.org/xapi/video/extensions/progress": progress,
                                "https://w3id.org/xapi/video/extensions/played-segments": played_segments
                            }
                        },
                        "context": {
                            "contextActivities": {
                                "category": [{
                                    "id": "https://w3id.org/xapi/video"
                                }]
                            },
                            "extensions": {
                                "https://w3id.org/xapi/video/extensions/length": length,
                                "https://w3id.org/xapi/video/extensions/session-id": sessionID

                            }
                        },
                        "timestamp": timeStamp
                    };

                    pausedStmt = add_registration_if_exists(pausedStmt);
                    //send paused statement to the LRS
                    console.log("paused statement sent");
                    ADL.XAPIWrapper.sendStatement(pausedStmt, function (resp, obj) {
                        console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
                    });
                    console.log(pausedStmt);
              
                if (terminate_player)
                    TerminateMyPlayer();
            } else {
                //skip subsequent play Event
                skipPlayEvent = true;
            }

        });


        /***************************************************************************************/
        /***** VIDEO.JS Video Completion | xAPI Completed Statement **********************************/
        /*************************************************************************************/
        var next_completion_check = 0;
        var completion_sent = false;
        function check_completion() {
			if(completion_sent)
			{
				console.log("completed statement already sent");
				return;
			}

            var currentTimestamp = (new Date()).getTime();

            if (currentTimestamp < next_completion_check) {
                //console.log(new Date(next_completion_check) + " in " + (next_completion_check - currentTimestamp)/1000 + " seconds");
                return;
            }
            var length = myPlayer.duration();
            console.log("length: " + length);
            if (length <= 0)
                return;

            var progress = get_progress();

            var remaining_seconds = (1 - progress) * length;
            //console.log("remaining_seconds: " + remaining_seconds);
            next_completion_check = currentTimestamp + remaining_seconds.toFixed(3) * 1000;
            console.log("Progress: " + progress + " currentTimestamp: " + currentTimestamp + " next completion check in " + (next_completion_check - currentTimestamp) / 1000 + " seconds");
       
        }

        function send_completed() {
            if(completion_sent)
            {
                console.log("completed statement already sent");
                return;
            }
            // get the current date and time and throw it into a variable for xAPI timestamp
            var dateTime = new Date();
            var timeStamp = dateTime.toISOString();
            
            var length = myPlayer.duration();

            // get the progress percentage and put it in a variable called progress
            var progress = get_progress();
            console.log("video progress percentage:" + progress + ".");

            var duration = calculate_duration();
            duration = "PT" + formatFloat(duration).toFixed(2) + "S";

            var completedStmt = {
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
                            "en-US": activityTitle
                        },
                        "description": {
                            "en-US": activityDesc
                        },
                        "type": "https://w3id.org/xapi/video/activity-type/video"
                    },
                    "objectType": "Activity"
                },
                "result": {
                    "duration": duration,
                    "completion": true,
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/time": currentTime,
                        "https://w3id.org/xapi/video/extensions/progress": progress,
                        "https://w3id.org/xapi/video/extensions/played-segments": played_segments
                    }
                },
                "context": {
                    "contextActivities": {
                        "category": [{
                            "id": "https://w3id.org/xapi/video"
                        }]
                    },
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
                        "https://w3id.org/xapi/video/extensions/length": length,
                        "https://w3id.org/xapi/video/extensions/completion-threshold": "1.0"
                        

                    }
                },
                "timestamp": timeStamp
            };

            completedStmt = add_registration_if_exists(completedStmt);
            //send completed statement to the LRS
            console.log("completed statement sent");
            ADL.XAPIWrapper.sendStatement(completedStmt, function (resp, obj) {
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
            });
            completion_sent = true;
            console.log(completedStmt);
            // create a modal window for the user to terminate the session and dispose of the player
            terminateModal();
        }

        /***************************************************************************************/
        /***** VIDEO.JS  Seekable Event | xAPI Seeked Statement *******************************/
        /*************************************************************************************/


        // get seekable start & end points
        var previousTime = 0;
        var currentTime = 0;
        var seekStart = null;

        myPlayer.on("timeupdate", function () {
            previousTime = currentTime;
            currentTime = formatFloat(myPlayer.currentTime());
            check_completion();
            check_volumechange();
        });

        myPlayer.on("seeking", function () {
            console.log("seeking", previousTime, myPlayer.currentTime(), seekStart);
            if (seekStart === null && previousTime != 0 || seekStart == 0) {
                seekStart = previousTime;
                console.log('seek start: ' + seekStart);
            }
        });


        function send_seeked() {
            if (Math.abs(seekStart - currentTime) < 1) //Ignore seeking if seeked for less than 1 second gap in video
            {
                seekStart = null; //reset seek
                return;
            }
            console.log("seeked:" + seekStart + "[.]" + currentTime);

            // get the current date and time and throw it into a variable for xAPI timestamp
            var dateTime = new Date();
            var timeStamp = dateTime.toISOString();

            // change the played segment in the video
            end_played_segment(seekStart);
            start_played_segment(currentTime);

            var seekedStmt = {
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
                            "en-US": activityTitle
                        },
                        "description": {
                            "en-US": activityDesc
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
                        "category": [{
                            "id": "https://w3id.org/xapi/video"
                        }]
                    },
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/session-id": sessionID

                    }
                },
                "timestamp": timeStamp
            };

            seekedStmt = add_registration_if_exists(seekedStmt);

            seekStart = null; //reset seek

            //send seeked statement to the LRS
            console.log("seeked statement sent");
            ADL.XAPIWrapper.sendStatement(seekedStmt, function (resp, obj) {
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
            });
            console.log(seekedStmt);
        }


        /***************************************************************************************/
        /***** VIDEO.JS Modal Close Event | xAPI Terminated Statement ************************/
        /*************************************************************************************/

        function terminateModal() {

            var modal = myPlayer.createModal('The video has ended. Click the close button to exit.');
            modal.on('modalclose', function () {
                TerminateMyPlayer();
            });

        }


        function TerminateMyPlayer() {

            // get the current date and time and throw it into a variable for xAPI timestamp
            var dateTime = new Date();
            var timeStamp = dateTime.toISOString();

            // get the progress percentage and put it in a variable called progress
            var progress = get_progress();
            console.log("video progress percentage:" + progress + ".");
            
            var length = myPlayer.duration();

            var terminatedStmt = {
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
                            "en-US": activityTitle
                        },
                        "description": {
                            "en-US": activityDesc
                        },
                        "type": "https://w3id.org/xapi/video/activity-type/video"
                    },
                    "objectType": "Activity"
                },
                "result": {
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/time": currentTime,
                        "https://w3id.org/xapi/video/extensions/progress": progress,
                        "https://w3id.org/xapi/video/extensions/played-segments": played_segments
                    }
                },
                "context": {
                    "contextActivities": {
                        "category": [{
                            "id": "https://w3id.org/xapi/video"
                        }]
                    },
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/length": length,
                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
                        "https://w3id.org/xapi/video/extensions/completion-threshold": "1.0"

                    }
                },
                "timestamp": timeStamp
            };

            terminatedStmt = add_registration_if_exists(terminatedStmt);
            //send completed statement to the LRS
            console.log("terminated statement sent");
            ADL.XAPIWrapper.sendStatement(terminatedStmt, function (resp, obj) {
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
            });
            console.log(terminatedStmt);
            myPlayer.dispose();
        };



        /***************************************************************************************/
        /***** VIDEO.JS VolumeChange Event | xAPI Interacted Statement ************************/
        /*************************************************************************************/
        var volume_changed_on = null,
            volume_changed_at = 0;
        myPlayer.on("volumechange", function () {
            var currentTimestamp = (new Date()).getTime();
            volume_changed_on = currentTimestamp;
            volume_changed_at = currentTime;
        });

        function check_volumechange() {
            var currentTimestamp = (new Date()).getTime();
            if (volume_changed_on != null && currentTimestamp > volume_changed_on + 2000) {
                send_volumechange(volume_changed_on, volume_changed_at);
                volume_changed_on = null;
            }
        }

        function send_volumechange(volume_changed_on, volume_changed_at) {
            // get the current date and time and throw it into a variable for xAPI timestamp
            var dateTime = new Date(volume_changed_on);
            var timeStamp = dateTime.toISOString();

            // get user volume and return it as a percentage
            var isMuted = myPlayer.muted();

            if (isMuted === true) {
                var volumeChange = 0;
            }
            if (isMuted === false) {
                var volumeChange = formatFloat(myPlayer.volume());
            }

            console.log("volume set to: " + volumeChange);

            var volChangeStmt = {
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
                            "en-US": activityTitle
                        },
                        "description": {
                            "en-US": activityDesc
                        },
                        "type": "https://w3id.org/xapi/video/activity-type/video"
                    },
                    "objectType": "Activity"
                },
                "result": {
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/time": volume_changed_at
                    }
                },
                "context": {
                    "contextActivities": {
                        "category": [{
                            "id": "https://w3id.org/xapi/video"
                        }]
                    },
                    "extensions": {
                        "https://w3id.org/xapi/video/extensions/session-id": sessionID,
                        "https://w3id.org/xapi/video/extensions/volume": volumeChange

                    }
                },
                "timestamp": timeStamp
            };

            volChangeStmt = add_registration_if_exists(volChangeStmt);
            //send volume change statement to the LRS
            console.log("interacted statement (volume change) sent");
            ADL.XAPIWrapper.sendStatement(volChangeStmt, function (resp, obj) {
                console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
            });
            console.log(volChangeStmt);
        }

        /***************************************************************************************/
        /***** VIDEO.JS Fullscreen Event | xAPI Interacted Statement **************************/
        /*************************************************************************************/

        myPlayer.on("fullscreenchange", function () {

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

                // get the current screen size
                var screenSize = "";
                screenSize += screen.width + "x" + screen.height;

                // get the playback size of the video
                var playbackSize = "";
                playbackSize += myPlayer.currentWidth() + "x" + myPlayer.currentHeight();
                //alert ("Playback Size:" + playbackSize);

                var fullScreenTrueStmt = {
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
                                "en-US": activityTitle
                            },
                            "description": {
                                "en-US": activityDesc
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
                            "category": [{
                                "id": "https://w3id.org/xapi/video"
                            }]
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

                fullScreenTrueStmt = add_registration_if_exists(fullScreenTrueStmt);
                //send full screen statement to the LRS
                console.log("interacted statement (fullScreen true) sent");
                ADL.XAPIWrapper.sendStatement(fullScreenTrueStmt, function (resp, obj) {
                    console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
                });
                console.log(fullScreenTrueStmt);
            }

            // if fullScreen is false then send a different interacted statement
            if (fullScreenOrNot === false) {

                // get the current date and time and throw it into a variable for xAPI timestamp
                var dateTime = new Date();
                var timeStamp = dateTime.toISOString();

                // get the current time position in the video
                var resultExtTime = formatFloat(myPlayer.currentTime());

                // get the current screen size
                var screenSize = "";
                screenSize += screen.width + "x" + screen.height;

                // get the playback size of the video
                var playbackSize = "";
                playbackSize += myPlayer.currentWidth() + "x" + myPlayer.currentHeight();
                //alert ("Playback Size:" + playbackSize);

                var fullScreenFalseStmt = {
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
                                "en-US": activityTitle
                            },
                            "description": {
                                "en-US": activityDesc
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
                            "category": [{
                                "id": "https://w3id.org/xapi/video"
                            }]
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

                fullScreenFalseStmt = add_registration_if_exists(fullScreenFalseStmt);
                //send exit full screen statement to the LRS
                console.log("interacted statement (fullscreen false) sent");
                ADL.XAPIWrapper.sendStatement(fullScreenFalseStmt, function (resp, obj) {
                    console.log("Response from LRS: " + resp.status + " - " + resp.statusText);
                });
                console.log(fullScreenFalseStmt);
            }
        });
    }


    ADL.XAPIVideoJS = XAPIVideoJS;
}(window.ADL = window.ADL || {}));
