# Simple HTTP Server for Local Testing
$port = 8080
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host " Classroom Wheel of Names Server Running at:" -ForegroundColor Green
    Write-Host " http://localhost:$port/" -ForegroundColor Yellow
    Write-Host " (Press Ctrl+C to stop the server)" -ForegroundColor Gray
    Write-Host "====================================================" -ForegroundColor Cyan

    # Open default browser
    Start-Process "http://localhost:$port/"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $reqUrl = $request.Url.LocalPath
        if ($reqUrl -eq "/" -or $reqUrl -eq "") {
            $reqUrl = "/index.html"
        }

        $localFile = Join-Path $path $reqUrl.TrimStart('/')

        if (Test-Path $localFile -PathType Leaf) {
            $contentBytes = [System.IO.File]::ReadAllBytes($localFile)
            $ext = [System.IO.Path]::GetExtension($localFile).ToLower()

            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $contentBytes.Length
            $response.OutputStream.Write($contentBytes, 0, $contentBytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
