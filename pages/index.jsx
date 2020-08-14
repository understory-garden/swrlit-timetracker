import { useState, useEffect } from 'react'
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
  getStringNoLocale, setStringNoLocale,
  getDatetime, setDatetime
} from '@itme/solid-client'
import { VCARD, FOAF, RDF, RDFS } from '@inrupt/vocab-common-rdf'
import { WS } from '@inrupt/vocab-solid-common'
import { schema } from 'rdf-namespaces';
import DateTimePicker from 'react-datetime';
import moment from 'moment'

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

function formatDuration(start, end){
  const seconds = end.diff(start, "seconds")
  const hours = Math.floor(seconds / 3600)
  const leftoverMinutes = Math.floor((seconds % 3600) / 60)
  const leftoverSeconds = (seconds % 60)

  return (
    <>
      {(hours > 0) && (<>{hours} hour{(hours > 1) && 's'}</>)}&nbsp;
      {(leftoverMinutes > 0) && (<>{leftoverMinutes} minutes</>)}&nbsp;
      {leftoverSeconds} seconds
    </>
  )
}

function Entry({ entryUri }){
  const { thing: entry, save } = useThing(entryUri)
  const description = getStringNoLocale(entry, RDFS.comment)
  const start = getDatetime(entry, schema.startTime)
  const end = getDatetime(entry, schema.endTime)
  const startMoment = start && moment(start)
  const endMoment = end && moment(end)
  return (
    <div className="my-6">
      <div className="text-lg">
        {description}
      </div>
      <div className="flex flex-row">
        <div>
          {startMoment && startMoment.format("MMMM Do, YYYY, h:mm:ss a")}
        </div>
        {startMoment && endMoment && (
          <div className="mx-6">
            {formatDuration(startMoment, endMoment)}
          </div>
        )}
      </div>
    </div>
  )
}

function Timelog({ log }){
  const url = asUrl(log)
  const { thing: timelog, save, resource, saveResource } = useThing(`${asUrl(log)}#log`)
  const name = timelog && getStringNoLocale(timelog, RDFS.label)
  const entries = timelog && getUrlAll(timelog, TIMELOG.entries)
  const [description, setDescription] = useState("")
  const [start, setStart] = useState(moment())
  const [end, setEnd] = useState(moment())
  const [timerStart, setTimerStart] = useState(moment())
  const [timerEnd, setTimerEnd] = useState(moment())
  const [timerRunning, setTimerRunning] = useState(false)

  const createEntry = async (startMoment, endMoment) => {
    var entry = createThing();
    entry = addUrl(entry, RDF.type, TIMELOG.Entry)
    entry = setStringNoLocale(entry, RDFS.comment, description)
    entry = setDatetime(entry, schema.startTime, startMoment.toDate())
    entry = setDatetime(entry, schema.endTime, endMoment.toDate())

    var newTimelog = addUrl(timelog, TIMELOG.entries, entry)
    var newResource = setThing(resource, newTimelog)
    newResource = setThing(newResource, entry)
    await saveResource(newResource)
    setDescription("")
  }

  function toggleTimer(){
    if (timerRunning){
      setTimerRunning(false)
      createEntry(timerStart, moment())
    } else {
      setTimerStart(moment())
      setTimerRunning(true)
    }
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerEnd(moment())
    }, 1000)
    return () => {
      clearInterval(interval)
    }
  })

  return (
    <div>
      <div className="flex">
        <h1 className="text-xl mb-6">
          <a href={url} target="_blank">{name}</a>
        </h1>
      </div>
      <div className="flex">
        <DateTimePicker
          onChange={setStart}
          value={start}
          />
        <DateTimePicker
          onChange={setEnd}
          value={end}
          />
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="description"/>

          <button className="btn btn-blue" onClick={() => createEntry(start, end)}>
          add&nbsp;entry
        </button>
      </div>
      <h3 className="bold">OR</h3>
      <button onClick={toggleTimer}>
        {timerRunning ? "stop" : "start"}
      </button>
      {timerRunning && (
        <div>{formatDuration(timerStart, timerEnd)}</div>
      )}
      {entries && entries.map(entry => <Entry key={entry} entryUri={entry}/>)}
    </div>
  )
}

function ttlFiles(resource) {
  return asUrl(resource).endsWith(".ttl")
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
    <div className="my-6">
      <button className="btn btn-blue mb-6" onClick={createTimelog}>Create New Tracker</button>
      <div className="flex">
        {timelogs && timelogs.filter(ttlFiles).map(log => <Timelog key={asUrl(log)} log={log}/>)}
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
        <div className="flex items-center my-6">
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
