import { useRouter } from 'next/router'
import { useThing } from "swrlit"
import { getStringNoLocale, getUrl } from '@itme/solid-client'
import { FOAF, VCARD } from '@inrupt/vocab-common-rdf'

function handleToWebId(handle) {
  if (handle) {
    try {
      new URL(handle);
      // if this doesn't throw, it's a valid URL
      return handle
    } catch (_) {
      return `https://${handle}/profile/card#me`
    }
  }
}

export default function Handle() {
  const router = useRouter()
  const { handle } = router.query
  const webId = handleToWebId(handle)
  const { thing: profile, ...rest } = useThing(webId)
  const profileImage = profile && getUrl(profile, VCARD.hasPhoto)
  const name = profile && getStringNoLocale(profile, FOAF.name)

  return (
    <div>
      <h1>{name}</h1>
      <img src={profileImage} alt={name} />
    </div>
  )
}
