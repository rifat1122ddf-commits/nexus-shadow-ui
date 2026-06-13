Set WshShell = CreateObject("WScript.Shell") 
WshShell.CurrentDirectory = "C:\Users\MMP\Downloads\112233-main\nexus-shadow-ui\" 
WshShell.Run "node server.js", 0, False 
