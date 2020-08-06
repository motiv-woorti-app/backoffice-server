/*
(C) 2017-2020 - The Woorti app is a research (non-commercial) application that was
developed in the context of the European research project MoTiV (motivproject.eu). The
code was developed by partner INESC-ID with contributions in graphics design by partner
TIS. The Woorti app development was one of the outcomes of a Work Package of the MoTiV
project.
 
The Woorti app was originally intended as a tool to support data collection regarding
mobility patterns from city and country-wide campaigns and provide the data and user
management to campaign managers.
 
The Woorti app development followed an agile approach taking into account ongoing
feedback of partners and testing users while continuing under development. This has
been carried out as an iterative process deploying new app versions. Along the 
timeline,various previously unforeseen requirements were identified, some requirements
Were revised, there were requests for modifications, extensions, or new aspects in
functionality or interaction as found useful or interesting to campaign managers and
other project partners. Most stemmed naturally from the very usage and ongoing testing
of the Woorti app. Hence, code and data structures were successively revised in a
way not only to accommodate this but, also importantly, to maintain compatibility with
the functionality, data and data structures of previous versions of the app, as new
version roll-out was never done from scratch.

The code developed for the Woorti app is made available as open source, namely to
contribute to further research in the area of the MoTiV project, and the app also makes
use of open source components as detailed in the Woorti app license. 
 
This project has received funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement No. 770145.
 
This file is part of the Woorti app referred to as SOFTWARE.
*/

var Ajv = require('ajv');

/**
 * Validates user personal information schema
 */
var userSchema = {
    "properties" : {
        "userid": {"type" : "string"},
        "email" : {"type" : "string", "format": "email"},
        "roles" : {
            "type" : "array",
            "items": {
                "type": "string"
            }
        },
        "pushNotificationToken" : {"type": "string"},
        "onCampaigns"   : {
            "type" : "array",
            "items": {
                "type": "string"
            }
        },
        "managesCampaigns" : {
            "type" : "array",
            "items": {
                "type": "string"
            }
        },
        "userSettings" : {
            "type": "object",
            "properties" : {
                "version"               : {"type": "number"},
                "prodValue"             : {"type": "number"},
                "relValue"              : {"type": "number"},
                "actValue"              : {"type": "number"},
                "name"                  : {"type": "string"},
                "country"               : {"type": "string"},
                "city"                  : {"type": "string", "default": ""},
                "minAge"                : {"type": "number"},
                "maxAge"                : {"type": "number"},
                "homeAddress"           : {
                    "type" : "object",
                    "properties" : {
                        "address" : {"type": "string"},
                        "location" : {
                            "type" : "object",
                            "properties" : {
                                "latitude" : {"type" : "number"},
                                "longitude" : {"type" : "number"}
                            },
                        "additionalProperties" : false                   
                        }
                    },
                    "additionalProperties" : false
                },
                "workAddress"           : {
                    "type" : "object",
                    "properties" : {
                        "address" : {"type": "string"},
                        "location" : {
                            "type" : "object",
                            "properties" : {
                                "latitude" : {"type" : "number"},
                                "longitude" : {"type" : "number"}
                            },
                        "additionalProperties" : false
                        }
                    },
                    "additionalProperties" : false
                },
                "gender"                : {"type": "string"},
                "degree"                : {"type": "string", "default": ""},
                "seenBateryPopup"       : {"type": "boolean"},
                "preferedMots"  : {
                    "type" : "array",
                    "items": {
                        "type": "object",
                        "properties" : {
                            "Mot"       : {"type": "number"},
                            "MotText"   : {"type": "string"},
                            "motsProd"  : {"type": "number"},
                            "motsRelax" : {"type": "number"},
                            "motsFit"   : {"type": "number", "default": 0}
                        },
                        "required" : ["Mot", "MotText", "motsProd", "motsRelax"],
                        "additionalProperties" : false
                    }
                },
                "hasSetMobilityGoal"            : {"type" : "boolean"},
                "mobilityGoalChosen"            : {"type": "number"},
                "mobilityGoalPoints"            : {"type": "number"},
                "lang"                          : {"type": "string"},
                "maritalStatusHousehold"        : {"type": "string"},
                "numberPeopleHousehold"         : {"type": "string"},
                "yearsOfResidenceHousehold"     : {"type": "string"},
                "labourStatusHousehold"         : {"type": "string"},
                "stories"                       : {
                    "type" : "array",
                    "items": {
                        "type": "object",
                        "properties" : {
                            "storyID"           : {"type": "number"},
                            "read"              : {"type" : "boolean"},
                            "readTimestamp"     : {"type": "number"},
                            "availableTimestamp": {"type": "number"}
                        },
                        "required" : ["storyID", "read", "readTimestamp", "availableTimestamp"],
                        "additionalProperties" : false
                    }
                },
                "pointsPerCampaign"              : {
                    "type" : "array",
                    "items": {
                        "type": "object",
                        "properties" : {
                            "campaignID"        : {"type": "string"},
                            "campaignScore"     : {"type": "number"}
                        },
                        "required" : ["campaignID", "campaignScore"],
                        "additionalProperties" : false
                    }
                },
                "chosenDefaultCampaignID"       : {"type": "string"},
                "hasGoneToDashboard"            : {"type": "boolean"},
                "hasReportedTrip"               : {"type": "boolean"},
                "dontShowTellUsMorePopup"       : {"type": "boolean"},
                "dontShowBlockPopup"            : {"type": "boolean"},
                "lastSummarySent"               : {"type": "number"},
                "engagementNotifications"       : {
                    "type" : "array",
                    "items": {
                        "type": "object",
                        "properties" : {
                            "title"             : {"type": "string"},
                            "text"              : {"type": "string"},
                            "sent"              : {"type": "number"}
                        },
                        "required" : ["title", "text", "sent"],
                        "additionalProperties" : false
                    }
                }
            },
            "required" : ["version", "prodValue", "relValue", "actValue", "name", "country", "minAge", "maxAge", "gender", "preferedMots"],
            "additionalProperties" : {              // temp, remove after define complete schema
                "maximum" : 25  
            }
        }
    },
    "required" : ["onCampaigns", "userSettings"],
    "additionalProperties" : {                      // temp, remove after define complete schema
        "maximum" : 10
    }
};

/**
 * Validates the trip schema
 */
var createRouteSchema = {
    "properties" : {
        "startDate"             : {"type": "number"},
        "endDate"               : {"type": "number"},
        "avSpeed"               : {"type": "number"},
        "mSpeed"                : {"type": "number"},
        "distance"              : {"type": "number"},
        "duration"              : {"type": "number"},
        "model"		            : {"type": "string"},
        "countryInfo"           : {"type": "string", "default": ""},
        "cityInfo"	            : {"type": "string", "default": ""},
        "oSVersion"	            : {"type": "string"},
        "oS"		            : {"type": "string"},
        "startAddress"	        : {"type": "string"},
        "finalAddress"	        : {"type": "string"},
        "overallScore"          : {"type": "number"},
        "didYouHaveToArrive"    : {"type": "integer"},
        "howOften"              : {"type": "integer"},
        "usetripMoreFor"        : {"type": "integer"},
        "shareInformation"	    : {"type": "string"},
        "manualTripStart"       : {"type" : "boolean"},
        "manualTripEnd"         : {"type" : "boolean"},
        "numSplits"             : {"type" : "integer"},
        "numMerges"             : {"type" : "integer"},
        "numDeletes"            : {"type" : "integer"},
        "validationDate"        : {"type" : "number"},

        "objective"     : {       // old version of objective. TODO: remove in March
            "type": "object",
            "properties" : {
                "tripObjectiveCode"       : {"type": "number"},
                "tripObjectiveString"       : {"type": "string"},
                },
            "required" : ["tripObjectiveCode", "tripObjectiveString"],
            "additionalProperties" : false
        },

        "objectives"     : {     // new version of objective (TODO: remove ProdActivities, MindActivities, BodyActivities in March)
            "type" : "array",
            "items": {
                "type": "object",
                "properties" : {
                    "tripObjectiveCode"       : {"type": "number"},
                    "tripObjectiveString"       : {"type": "string"},
                    },
                "required" : ["tripObjectiveCode", "tripObjectiveString"],
                "additionalProperties" : false
            }
        },

        "trips"      : {
            "type" : "array",
            "items": {
                "type": "object",
                "oneOf" : [
                	{
                        "properties" : {
                            "type"              : {"enum": ["WaitingEvent"]},
                            "startDate"         : {"type": "number"},
                            "endDate"           : {"type": "number"},
                            "avLocationLat"     : {"type": "number"},
                            "avLocationLon"     : {"type": "number"},
                            "wastedTime"        : {"type": "integer"},
                            "otherFactor"       : {"type": "string"},
                            "infrastructureAndServicesFactors" : {          // TODO: remove in new versions
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "activitiesFactors" : {         // v5, new activities
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "whileYouRideFactors" : {         // v5, new activities
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "comfortAndPleasentFactors"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "gettingThereFactors"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "valueFromTrip"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "value" : {"type" : "integer" }
                                    }, 
                                    "required" : ["code", "value"],
                                    "additionalProperties" : false
                                }
                            },

                            "productivityRelaxingRating"        : {"type": "object",
                                "properties" : {
                                    "productivity"         : {"type": "number"},
                                    "relaxing"             : {"type": "number"},
                                    },
                                "required" : ["productivity", "relaxing"],
                                "additionalProperties" : false
                            },


                            "RelaxingFactors"   : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "factorCode" : {"type" : "string" },
                                        "factorText" : {"type" : "string" },
                                        "orderValue" : {"type" : "number" },
                                        "satisfactionFactor" : {"type" : "number" },
                                        "additionalProperties" : false
                                    }
                                }
                            },

                            "ProductiveFactors"   : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "factorCode" : {"type" : "string" },
                                        "factorText" : {"type" : "string" },
                                        "orderValue" : {"type" : "number" },
                                        "satisfactionFactor" : {"type" : "number" },
                                        "additionalProperties" : false
                                    }
                                }
                            },

                            "ProductiveFactorsText" : {"type" : "string"},
                            "RelaxingFactorsText" : {"type" : "string"},

                            "ProdActivities"     : {    // TODO: remove in March
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },
                            "MindActivities"     : {    // TODO: remove in March
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },
                            "BodyActivities"     : {    // TODO: remove in March
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },

                            "genericActivities"     : {    // trips v4
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : {
                                        "maximum" : 5
                                    }
                                }
                            },

                            "locations"         : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "lat"       : {"type": "number"},
                                        "lon"       : {"type": "number"},
                                        "timestamp" : {"type": "number"},
                                        "acc"       : {"type": "number"}
                                        },
                                    "required" : ["lat", "lon", "timestamp", "acc"],
                                    "additionalProperties" : false
                                    }
                                }
                        },
                        "required" : ["type", "startDate", "endDate", "avLocationLat", "avLocationLon", "locations"],
                        "additionalProperties" : {
                            "maximum" : 30
                        }
                    },
                    {
                        "properties" : {
                            "type"              				: {"enum": ["Trip"]},
                            "startDate"         				: {"type": "number"},
                            "endDate"           				: {"type": "number"},
                            "avSpeed"           				: {"type": "number"},
                            "mSpeed"            				: {"type": "number"},
                            "distance"          				: {"type": "number"},
                            "duration"         					: {"type": "number"},
                            "modeOfTransport"   				: {"type": "integer"},
                            "detectedModeOfTransport"           : {"type": "integer", "default": 4},
                            "correctedModeOfTransport" 			: {"type": "integer"},
                            "accelerationMean"					: {"type": "number"},
                            "filteredAcceleration"				: {"type": "number"},
                            "filteredAccelerationBelowThreshold": {"type": "number"},
                            "filteredSpeed"						: {"type": "number"},
                            "filteredSpeedBelowThreshold"		: {"type": "number"},
                            "accuracyMean"						: {"type": "number"},
                            "wrongLeg"							: {"type": "boolean"},
                            "trueDistance"                      : {"type": "number"},
                            "wasMerged"                         : {"type": "boolean"},
                            "wasSplit"                          : {"type": "boolean"},
                            "otherMotText"                      : {"type": "string"},
                            "wastedTime"                        : {"type": "integer"},
                            "otherFactor"                      : {"type": "string"},
                            "infrastructureAndServicesFactors" : {          // TODO: remove in new versions
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "activitiesFactors" : {         // v5, new activities
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "whileYouRideFactors" : {         // v5, new activities
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "comfortAndPleasentFactors"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "gettingThereFactors"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "plus" : {"type" : "boolean" },
                                        "minus" : {"type" : "boolean" }
                                    }, 
                                    "required" : ["code", "plus", "minus"],
                                    "additionalProperties" : false
                                }
                            },
                            "valueFromTrip"         : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "code" : {"type" : "integer" },
                                        "value" : {"type" : "integer" }
                                    }, 
                                    "required" : ["code", "value"],
                                    "additionalProperties" : false
                                }
                            },

                            "productivityRelaxingRating"        : {
                                "type": "object",
                                "properties" : {
                                    "productivity"         : {"type": "number"},
                                    "relaxing"             : {"type": "number"},
                                    },
                                "required" : ["productivity", "relaxing"],
                                "additionalProperties" : false
                            },

                            "RelaxingFactors"   : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "factorCode" : {"type" : "string" },
                                        "factorText" : {"type" : "string" },
                                        "orderValue" : {"type" : "number" },
                                        "satisfactionFactor" : {"type" : "number" },
                                        "additionalProperties" : false
                                    }
                                }
                            },
                            "ProductiveFactors"   : {
                                "type" : "array",
                                "item" : {
                                    "type" : "object",
                                    "properties" : {
                                        "factorCode" : {"type" : "string" },
                                        "factorText" : {"type" : "string" },
                                        "orderValue" : {"type" : "number" },
                                        "satisfactionFactor" : {"type" : "number" },
                                        "additionalProperties" : false
                                    }
                                }
                            },
                            "ProductiveFactorsText" : {"type" : "string"},
                            "RelaxingFactorsText" : {"type" : "string"},

                            "ProdActivities"     : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },
                            "MindActivities"     : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },
                            "BodyActivities"     : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : false
                                    }
                            },
                            "genericActivities"     : {    // trips v4
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "text"       : {"type": "string"},
                                        "code"       : {"type": "string"},
                                        },
                                    "required" : ["text", "code"],
                                    "additionalProperties" : {
                                        "maximum" : 5
                                    }
                                }
                            },
                            "locations"         : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "lat"       : {"type": "number"},
                                        "lon"       : {"type": "number"},
                                        "timestamp" : {"type": "number"},
                                        "acc"       : {"type": "number"}
                                        },
                                    "required" : ["lat", "lon", "timestamp", "acc"],
                                    "additionalProperties" : false
                                    }
                                },
                            "accelerations"       : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "xvalue"       : {"type": "number"},
                                        "yvalue"       : {"type": "number"},
                                        "zvalue"       : {"type": "number"},
                                        "timestamp" : {"type": "number"}
                                        },
                                    "required" : ["xvalue", "yvalue", "zvalue", "timestamp"],
                                    "additionalProperties" : false
                                    }
                                },
                            "activityList"       : {
                                "type" : "array",
                                "items" : {
                                    "type" : "object",
                                    "properties" : {
                                        "timestamp" : {"type": "number"},
                                        "listOfDetectedActivities"       : {
			                                "type" : "array",
			                                "items" : {
			                                    "type" : "object",
			                                    "properties" : {
			                                        "confidenceLevel" : {"type": "integer"},
			                                        "type"			  : {"type": "integer"}
			                                        },
			                                    "required" : ["confidenceLevel", "type"],
			                                    "additionalProperties" : false
			                                    }
			                                }
                                        },
                                    "required" : ["timestamp", "listOfDetectedActivities"],
                                    "additionalProperties" : false
                                    }
                                }
                            },
                            "required" : ["type", "startDate", "endDate", "avSpeed", "mSpeed", "distance", "duration", "modeOfTransport", "detectedModeOfTransport", "correctedModeOfTransport", "accelerationMean", "filteredAcceleration", "filteredAccelerationBelowThreshold", "filteredSpeed", "filteredSpeedBelowThreshold", "accuracyMean", "wrongLeg", "locations", "accelerations", "activityList"],
                            "additionalProperties" : {
                                "maximum" : 30
                            }
                    }
                ],

                
            }
        },
    },
    "required" : ["startDate", "endDate", "avSpeed", "mSpeed", "distance", "duration", "model", "countryInfo", "cityInfo", "oSVersion", "oS", "trips"],
    "additionalProperties" : {
        "maximum" : 10
    }
};

/**
 * Currently not used
 * Validates the statistics schema
 */
var statisticsSchema = {
    "properties" : {
        "numDays": {
            "type" : "array",
            "items": {"type": "number"}
        }
    },
    "required" : ["numDays"],
    "additionalProperties" : false
};

/**
 * Validates the survey answers from user
 */
var surveyAnswerSchema = {
    "properties" : {
        "version": {"type": "number"},
        "surveyID": {"type": "number"},
        "uid": {"type": "string"},
        "triggerDate": {"type": "number"},
        "answerDate": {"type": "number"},
        "lang": {"type": "string"},
        "reportingID": {"type": "string"},
        "reportingOS": {"type": "string"},
        "reportedByWeb": {"type": "boolean"},
        "attachmentFilename": {"type": "string"},
        "answers": {
            "type": "array",
            "items": {
                "type": "object",
                "oneOf" : [
                    {
                        "properties" : {
                            "questionID": {"type": "string"},
                            "questionType": {"enum": ["shortText", "paragraph"]},
                            "answer": {"type": "string"}
                        },
                        "required" : ["questionID", "questionType", "answer"],
                        "additionalProperties" : false
                    },
                    {
                        "properties" : {
                            "questionID": {"type": "string"},
                            "questionType": {"enum": ["scale", "dropdown", "multipleChoice"]},
                            "answer": {"type": "integer"}
                        },
                        "required" : ["questionID", "questionType", "answer"],
                        "additionalProperties" : false
                    },
                    {
                        "properties" : {
                            "questionID": {"type": "string"},
                            "questionType": {"enum": ["yesNo"]},
                            "answer": {"type": "boolean"}
                        },
                        "required" : ["questionID", "questionType", "answer"],
                        "additionalProperties" : false
                    },
                    {
                        "properties" : {
                            "questionID": {"type": "string"},
                            "questionType": {"enum": ["checkboxes"]},
                            "answer": {
                                    "type": "array",
                                    "items": {"type": "integer"}
                                }
                        },
                        "required" : ["questionID", "questionType", "answer"],
                        "additionalProperties" : false
                    }
                ]
            }
        }
    },
    "required" : ["version", "surveyID", "uid", "triggerDate", "answerDate", "lang", "answers"],
    "additionalProperties" : false
};


/**
 * Validates the reward creation schema
 */
var rewardSchema = {
    "properties" : {
        "rewardId":         {"type": "string"},
        "rewardName":       {"type": "string"},
        "targetCampaignId": {"type": "string"},
        "startDate":        {"type": "number"},
        "endDate":          {"type": "number"},
        "targetType":       {"type": "number"},
        "targetValue":      {"type": "number"},
        "organizerName":    {"type": "string"},
        "linkToContact":    {"type": "string"},
        "removed":          {"type": "boolean"},
        "defaultLanguage":  {"type": "string"},
        
        "descriptions": {
            "patternProperties": {
                "^.*$": {               // pattern accepts any name
                    "type" : "object",
                    "properties" : {
                        "shortDescription" :    {"type" : "string" },
                        "longDescription" :     {"type" : "string" },
                    },
                    "required": ["shortDescription", "longDescription"],
                    "additionalProperties" : false
                }
            }
        }
    },
    "required" : ["rewardName", "targetCampaignId", "startDate", "endDate", "targetType", "targetValue", "organizerName", "linkToContact", "removed", "defaultLanguage", "descriptions"],
    "additionalProperties" : false
};

/**
 * Validates reward status update schema
 */
var rewardStatusSchema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties" : {
            "userid":                      {"type": "string"},      // may appear in some requests
            "rewardID":                    {"type": "string"},
            "currentValue":                {"type": "number"},
            "rewardVersion":               {"type": "number"},
            "hasShownPopup":               {"type": "boolean"},
            "timestampsOfDaysWithTrips":   {
                "type": "array",
                "items": {
                    "type": "number"
                }
            } 
        },
        "required" : ["rewardID", "currentValue", "rewardVersion", "timestampsOfDaysWithTrips"],
        "additionalProperties" : false
    }
};


var ajv = new Ajv({ useDefaults: true });

module.exports.validate = {
    UPDATE_USER_INFO : ajv.compile(userSchema),
    CREATE_NEW_ROUTE : ajv.compile(createRouteSchema),
    STATISTICS : ajv.compile(statisticsSchema),
    SURVEY_ANSWER : ajv.compile(surveyAnswerSchema),
    REWARD : ajv.compile(rewardSchema),
    REWARDS_STATUS : ajv.compile(rewardStatusSchema)
};