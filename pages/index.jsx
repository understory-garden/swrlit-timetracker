import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  useWebId, useAuthentication,
  useMyProfile, useProfile,
  useEnsured, useContainer,
  useThing
} from 'swrlit'
import {
  createSolidDataset, saveSolidDatasetInContainer,
  setThing, createThing, asUrl,
  getUrl, getUrlAll, addUrl,
  getStringNoLocale, setStringNoLocale
} from '@itme/solid-client'
import { VCARD, FOAF, RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { WS } from '@inrupt/vocab-solid-common'

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
  <div className="animate-spin w-6 h-6">⏰</div>
)

export function useStorageContainer(webId) {
  const { profile } = useProfile(webId)
  return profile && getUrl(profile, WS.storage)
}

export function useTimelogContainerUri(webId, path = 'public') {
  const storageContainer = useStorageContainer(webId)
  return useEnsured(storageContainer && `${storageContainer}${path}/timelogs/`)
}

const timelogNs = "https://itme.online/v/timelog#"
const TIMELOG = {
  Log: `${timelogNs}Log`,
  Entry: `${timelogNs}Entry`,
  entries: `${timelogNs}entries`
}

function Entry({ entryUri }){
  const { thing: entry, save } = useThing(entryUri)
  const description = getStringNoLocale(entry, RDFS.comment)
  return (
    <div>
      {description}
    </div>
  )
}

function Timelog({ log }){
  const url = asUrl(log)
  const { thing: timelog, save, resource, saveResource } = useThing(`${asUrl(log)}#log`)
  const name = timelog && getStringNoLocale(timelog, RDFS.label)
  const entries = timelog && getUrlAll(timelog, TIMELOG.entries)

  const createEntry = async (description, start, end) => {
    var entry = createThing();
    entry = addUrl(entry, RDF.type, TIMELOG.Entry)
    entry = setStringNoLocale(entry, RDFS.comment, description)

    var newTimelog = addUrl(timelog, TIMELOG.entries, entry)
    var newResource = setThing(resource, newTimelog)
    newResource = setThing(newResource, entry)
    await saveResource(newResource)
  }

  return (
    <div key={url}>
      <h1><a href={url} target="_blank">{name}</a></h1>
      <button className="btn btn-blue" onClick={() => createEntry("I did some werk")}>
        Add Entry
      </button>
      {entries && entries.map(entry => <Entry key={entry} entryUri={entry}/>)}
    </div>
  )
}

function TimeTrackers() {
  const myWebId = useWebId()
  const timelogContainerUri = useTimelogContainerUri(myWebId, 'private')
  const { resources: timelogs, mutate: mutateTimelogs } = useContainer(timelogContainerUri)

  const createTimelog = async ({ name = "Time Tracker"}) => {
    var log = createThing({ name: 'log' });
    log = addUrl(log, RDF.type, TIMELOG.Log)
    log = setStringNoLocale(log, RDFS.label, name)

    var dataset = createSolidDataset()
    dataset = setThing(dataset, log)

    await saveSolidDatasetInContainer(timelogContainerUri, dataset, { slugSuggestion: name })
    mutateTimelogs()
  }

  return timelogs ? (
    <div>
      <button className="btn btn-blue" onClick={createTimelog}>Create New Tracker</button>
      <div className="flex">
        {timelogs && timelogs.map(log => <Timelog key={asUrl(log)} log={log}/>)}
      </div>
    </div>
  ) : (
      <Loader />
    )
}

export default function Home() {
  const {profile} = useMyProfile()
  const profileImage = profile && getUrl(profile, VCARD.hasPhoto)
  const name = profile && getStringNoLocale(profile, FOAF.name)

  return (
    <div className="container">
      <Head>
        <title>swrlit time tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="m-6">
        <div className="flex">
          <img className="h-12 my-6" src={profileImage} alt={name} />
          <h1 className="text-xl mr-6">hi, {name}</h1>
          <AuthButton />
        </div>

        <TimeTrackers />
      </main>
      <footer>
      </footer>
    </div>
  )
}
