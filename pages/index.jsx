import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useMyProfile, useWebId } from "swrlit"
import {
  getUrl, getStringNoLocale, setStringNoLocale
} from '@itme/solid-client'
import { vcard, foaf } from 'rdf-namespaces'

import auth from "solid-auth-client"


export function AuthButton() {
  const webId = useWebId()
  if (webId === undefined) {
    return <div>loading...</div>
  } else if (webId === null) {
    return (
      <button onClick={() => auth.popupLogin({ popupUri: "/popup.html" })}>
        Log In
      </button>
    )
  } else {
    return <button onClick={() => auth.logout()}>Log Out</button>
  }
}

const Loader = () => (
  <div className="animate-spin w-6 h-6">me</div>
)

function MyProfile() {
  const { profile, save: saveProfile } = useMyProfile()
  const profileImage = profile && getUrl(profile, vcard.hasPhoto)
  const name = profile && getStringNoLocale(profile, foaf.name)
  const [newName, setNewName] = useState("")
  const saveNewName = () => {
    saveProfile(setStringNoLocale(profile, foaf.name, newName))
  }
  return profile ? (
    <div>
      <img className="h-48 my-6" src={profileImage} alt={name} />
      <div className="flex flex-row">
        <h1 className="text-xl mr-6">hi, {name}</h1>
        <p>
          <input type="text" onChange={e => setNewName(e.target.value)} />
          <button onClick={saveNewName}>save new name</button>
        </p>
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
          <>
            <MyProfile />
            <h1 className="text-xl mt-12">Friends</h1>
            <div className="flex flex-col">
              <Link href="/profile/[handle]" as={`/profile/tobytoberson.inrupt.net`}>
                <a>
                  Toby
                </a>
              </Link>
            </div>
          </>
        )}
        <nav>
          <AuthButton />
        </nav>
      </main>
      <footer>
      </footer>
    </div>
  )
}
