import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useMyProfile, useProfile, useWebId, useAuthentication } from 'swrlit'
import {
  getUrl, getUrlAll, getStringNoLocale, setStringNoLocale
} from '@itme/solid-client'
import { VCARD, FOAF } from '@inrupt/vocab-common-rdf'

export function AuthButton() {
  const { popupLogin, logout } = useAuthentication()
  const webId = useWebId()
  if (webId === undefined) {
    return <div>loading...</div>
  } else if (webId === null) {
    return (
      <button onClick={() => popupLogin({ popupUri: "/popup.html" })}>
        log in
      </button>
    )
  } else {
    return <button onClick={() => logout()}>log out</button>
  }
}

const Loader = () => (
  <div className="animate-spin w-6 h-6">me</div>
)

function Friend({ webId }) {
  const { profile } = useProfile(webId)
  const name = profile && getStringNoLocale(profile, FOAF.name)
  return (
    <Link href="/profile/[handle]" as={`/profile/${encodeURIComponent(webId)}`}>
      <a>
        {name || ''}
      </a>
    </Link>
  )
}

function MyProfile() {
  const { profile, save: saveProfile } = useMyProfile()
  const profileImage = profile && getUrl(profile, VCARD.hasPhoto)
  const name = profile && getStringNoLocale(profile, FOAF.name)
  const knows = profile && getUrlAll(profile, FOAF.knows)
  const [newName, setNewName] = useState("")
  const saveNewName = () => {
    saveProfile(setStringNoLocale(profile, FOAF.name, newName))
  }
  return profile ? (
    <div>
      <img className="h-48 my-6" src={profileImage} alt={name} />
      <div className="flex flex-col">
        <h1 className="text-xl mr-6">hi, {name}</h1>
        <p>
          <input type="text" onChange={e => setNewName(e.target.value)} />
          <button onClick={saveNewName}>save new name</button>
        </p>
      </div>
      <h1 className="text-xl mt-12">Friends</h1>
      <div className="flex flex-col">
        {knows && knows.map(url => (
          <Friend webId={url} key={url} />
        ))}
      </div>
    </div>
  ) : (
      <Loader />
    )
}

export default function Home() {
  const webId = useWebId()

  return (
    <div className="container">
      <Head>
        <title>swrlit</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="m-6">
        {webId && (
          <MyProfile />
        )}
        <nav className="mt-12">
          <AuthButton />
        </nav>
      </main>
      <footer>
      </footer>
    </div>
  )
}
