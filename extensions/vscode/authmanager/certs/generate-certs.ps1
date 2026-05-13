# 这是一个用于在 Windows 上生成自签名证书的 PowerShell 脚本
# 它将创建一个证书并将其导出为 PEM 格式，以便 Node.js 服务器使用

$certName = "ContinueLocalDev"
$certPath = "cert:LocalMachine\My"

# 1. 创建自签名证书
Write-Host "Creating self-signed certificate..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation $certPath -FriendlyName $certName -NotAfter (Get-Date).AddYears(1)

# 2. 导出私钥 (需要密码)
$password = ConvertTo-SecureString -String "password" -Force -AsPlainText
$pfxPath = Join-Path $PSScriptRoot "temp.pfx"
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password

# 3. 提示用户使用 openssl 或其他工具将 PFX 转换为 PEM
# 由于此环境可能没有 openssl，我们将提醒用户。
# 如果你有 openssl，可以运行:
# openssl pkcs12 -in temp.pfx -nocerts -out key.pem -nodes -passin pass:password
# openssl pkcs12 -in temp.pfx -clcerts -nokeys -out cert.pem -passin pass:password

Write-Host "Certificate created in store: $certPath" -ForegroundColor Green
Write-Host "PFX file exported to: $pfxPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "NOTE: To use this with the Node.js server, you need to convert PFX to PEM (cert.pem and key.pem)."
Write-Host "If you have openssl installed, run these commands:"
Write-Host "  openssl pkcs12 -in temp.pfx -nocerts -out key.pem -nodes -passin pass:password"
Write-Host "  openssl pkcs12 -in temp.pfx -clcerts -nokeys -out cert.pem -passin pass:password"
Write-Host ""
Write-Host "Alternatively, for local testing, you can use pre-generated certs or just use HTTP for now."
