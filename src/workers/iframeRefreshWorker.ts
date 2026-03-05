type StartMessage = {
  type: 'start'
  intervalMs: number
}

type StopMessage = {
  type: 'stop'
}

type WorkerMessage = StartMessage | StopMessage

let timeoutId: number | null = null

function stopTimer() {
  if (timeoutId === null) {
    return
  }

  clearTimeout(timeoutId)
  timeoutId = null
}

function startTimer(intervalMs: number) {
  stopTimer()

  const safeIntervalMs = Math.max(1_000, Math.round(intervalMs))

  const tick = () => {
    self.postMessage({ type: 'tick' })
    timeoutId = self.setTimeout(tick, safeIntervalMs)
  }

  timeoutId = self.setTimeout(tick, safeIntervalMs)
}

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type === 'stop') {
    stopTimer()
    return
  }

  startTimer(event.data.intervalMs)
})
