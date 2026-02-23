import { contextBridge } from 'electron'

// No IPC needed for this simple demo
contextBridge.exposeInMainWorld('electron', {})
