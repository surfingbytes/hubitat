/*
 *
 *  Tuya Zigbee Contact Sensor Version v1.0.0
 *
 */

metadata {
	definition (name: "Tuya Zigbee Contact Sensor", namespace: "surfingbytes", author: "Tomas Trecek", importUrl: "https://raw.githubusercontent.com/surfingbytes/hubitat/master/drivers/tuya-zigbee-contact-sensor.groovy") {
        capability "Sensor"
        capability "Initialize"
        capability "ContactSensor"
        capability "MotionSensor"

        command "resetToOpen"
        command "resetToClosed"

        fingerprint deviceJoinName: "Tuya Contact Sensor", model: "TS0203", profileId: "0104", deviceId: "5F01", inClusters:"0000,0003,0001,0500", outClusters:"0000,0003,0001,0500", manufacturer: "_TYZB01_xph99wvr"
  }

  preferences {
      input(name: "debugLogging", type: "bool", title: "Enable debug logging", description: "", defaultValue: false, submitOnChange: true, displayDuringSetup: false, required: true)
      input(name: "infoLogging", type: "bool", title: "Enable info logging", description: "", defaultValue: true, submitOnChange: true, displayDuringSetup: false, required: true)
      input(name: "enableMotion", type: "bool", title: "Enable motion", description: "", defaultValue: false, submitOnChange: true, displayDuringSetup: false, required: true)
      input(name: "resetMotionSeconds", type: "number", title: "Reset motion after (seconds)", description: "", defaultValue: 30, submitOnChange: true, displayDuringSetup: false, required: true)
	}

}

void initialize() {
    logInfo("initialize()")
    unschedule()
}

def void parse(String description) {
    logDebug("Parsing: '${description}'")
    Map msgMap = zigbee.parseDescriptionAsMap(description)
    logInfo("msgMap: ${msgMap}")

    if (msgMap["cluster"] == '0500' && msgMap["attrId"] == '0002') {
      if (Integer.parseInt(msgMap['value'], 16) == 0) {
        close()
      } else {
        open()        
      }
    } else {
      log.warn("General catch all - description:${description} | msgMap:${msgMap}")
    }
}

private void logDebug(message) {
    if (debugLogging) log.debug(message)
}

private void logInfo(message) {
    if (infoLogging) log.info(message)
}

void open() {
    logInfo("Contact open")
    setToOpen(false)
}

void close() {
    logInfo("Contact closed")
    setToClose(false)
}

void resetToOpen() {
    logInfo("resetToOpen()")
    setToOpen(true)
}

void resetToClosed() {
    logInfo("resetToClosed()")
    setToClose(true)
}

private void setToOpen(boolean reset)
{
    resetText = reset ? " (reset)" : ""
    sendEvent(name: "contact", value: "open", isStateChange: !reset, descriptionText: "Contact open${resetText}")
    if (enableMotion) {
        if (resetMotionSeconds > 0) {
          runIn(resetMotionSeconds, 'deactivateMotion')
        } else {
          deactivateMotion()
        }
    }
}

private void setToClose(boolean reset)
{
    resetText = reset ? " (reset)" : ""
    sendEvent(name: "contact", value: "closed", isStateChange: !reset, descriptionText: "Contact closed${resetText}")
    if (enableMotion) {
      unschedule('deactivateMotion')
      sendEvent(name: "motion", value: "active", isStateChange: !reset, descriptionText: "Motion active${resetText}")
    }
}

private void deactivateMotion() {
    sendEvent(name: "motion", value: "inactive", isStateChange: !reset, descriptionText: "Motion inactive")
}
