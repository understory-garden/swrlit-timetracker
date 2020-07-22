import { useRouter } from 'next/router'
import { useProfile } from "swrlit"
import { getStringNoLocaleOne } from '@itme/lit-pod'
import { foaf } from 'rdf-namespaces'

function handleToWebId(handle) {
  try {
    new URL(handle);
    // if this doesn't throw, it's a valid URL
    return handle
  } catch (_) {
    return `https://${handle}/profile/card#me`
  }
}

export default function Handle() {
  const router = useRouter()
  const { handle } = router.query
  const webId = handleToWebId(handle)
  const { profile } = useProfile(webId)
  const name = profile && getStringNoLocaleOne(profile, foaf.name)

  return (
    <div>
      hello, {name}
    </div>
  )
}
