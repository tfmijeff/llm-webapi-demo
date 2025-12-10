# 使用 Windows Server Core + IIS
FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8

# 建立網站資料夾
RUN mkdir C:\app

# 複製 publish 資料夾內容到 container
COPY publish/ C:/app/

# 移除預設 IIS 網站
RUN Remove-Website -Name "Default Web Site"

# 建立新的 IIS 網站
RUN New-Website -Name "WebAPI" -Port 80 -PhysicalPath "C:\app"
