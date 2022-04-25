module.exports = class EventLog {
  constructor(id, secretKey, core){
    this.id = id
    this.secretKey = secretKey
    this.core = core
  }

  get writable(){ return this.core.writable }

  [Symbol.for('nodejs.util.inspect.custom')](depth, opts){
    let indent = ''
    if (typeof opts.indentationLvl === 'number')
      while (indent.length < opts.indentationLvl) indent += ' '
    return this.constructor.name + '(\n' +
      indent + '  id: ' + opts.stylize(this.id, 'string') + '\n' +
      indent + '  writable: ' + opts.stylize(this.writable, 'boolean') + '\n' +
      indent + ')'
  }

  async ready(){
    await this.core.ready()
  }

  async update(){
    await this.ready()
    await this.core.update()
  }

  async appendBatch(...updates){
    await this.core.append(
      ...updates.map(([eventType, payload]) =>
        serialize({...payload, eventType, at: Date.now()})
      )
    )
  }

  async append(eventType, payload){
    return await this.appendBatch([eventType, payload])
  }

  async getAllEvents(){
    const gets = []
    for (let i = this.core.length - 1; i >= 0; i--)
      gets.push(this.core.get(i))
    const rawEvents = await Promise.all(gets)
    return rawEvents.map(json => {
      const event = deserialize(json)
      event.at = new Date(event.at)
      return event
    })
  }

  async getEventsForType(eventType){
    return (await this.getAllEvents())
      .filter(e => e.eventType === eventType)
  }

}


function serialize(payload){ return JSON.stringify(payload) }

function deserialize(msg){ return JSON.parse(msg) }
