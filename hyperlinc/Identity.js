const EventLog = require('./EventLog')

module.exports = class Identity extends EventLog {

  async init({ appUrl }){
    console.log('init', this)
    await this.declareAppAgent({ appUrl })
  }

  async declareAppAgent({ appUrl }){
    console.log('declairing app agent', this, appUrl)
    await this.append('declareAppAgent', { url: appUrl })
  }

  async patchProfile(patch){
    await this.append('patchProfile', {patch})
  }

  async getProfile(){
    console.log('Hyperlinc Identity getProfile', this)
    const events = await this.getEventsForType('patchProfile')
    return events.reverse().reduce(
      (profile, {patch}) => Object.assign(profile, patch),
      {}
    )
  }
}
