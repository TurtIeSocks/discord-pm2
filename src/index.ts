import { startDiscord } from './discord/client'
import { register } from './discord/register'

register().then(() => startDiscord())
