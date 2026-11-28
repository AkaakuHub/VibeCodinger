!include "StrFunc.nsh"
!ifdef BUILD_UNINSTALLER
  ${UnStrRep}
  !define VCStrRep '${UnStrRep}'
!else
  ${StrRep}
<<<<<<< 7fa8be15bd9b767bd51bc62484531cfe73d3a751
  !define VCStrRep '${StrRep}'
=======
  !define T3StrRep '${StrRep}'
  Var t3AppWasRunning
>>>>>>> ab1915b658e54d665e29fef824087a41186706cd
!endif

!macro customAppRunningMessages
  !ifndef BUILD_UNINSTALLER
    StrCpy $t3AppWasRunning 1
  !endif
  Push $0
  Push $1
  ${If} $IsPowerShellAvailable == 0
    System::Call 'kernel32::SetEnvironmentVariable(t "VIBECODINGER_INSTALL_DIR", t "$INSTDIR")'
    nsExec::ExecToStack `"$PowerShellPath" -NoProfile -NonInteractive -C "Get-CimInstance -ClassName Win32_Process | Where-Object { $$_.ExecutablePath -and [IO.Path]::GetDirectoryName($$_.ExecutablePath) -eq $$env:VIBECODINGER_INSTALL_DIR } | ForEach-Object { [IO.Path]::GetFileNameWithoutExtension($$_.ExecutablePath) } | Where-Object { $$_ -in 'VibeCodinger (Alpha)', 'VibeCodinger (Beta)', 'VibeCodinger (Nightly)' } | Select-Object -First 1 | ForEach-Object { [Console]::Write($$_) }"`
    Pop $0
    Pop $1
    System::Call 'kernel32::SetEnvironmentVariable(t "VIBECODINGER_INSTALL_DIR", p 0)'
    ${If} $0 == 0
      ${If} $1 == "VibeCodinger (Alpha)"
      ${OrIf} $1 == "VibeCodinger (Beta)"
      ${OrIf} $1 == "VibeCodinger (Nightly)"
        ${VCStrRep} $appRunningMessage $appRunningMessage "${PRODUCT_NAME}" $1
        ${VCStrRep} $appClosingMessage $appClosingMessage "${PRODUCT_NAME}" $1
        ${VCStrRep} $appCannotBeClosedMessage $appCannotBeClosedMessage "${PRODUCT_NAME}" $1
      ${EndIf}
    ${EndIf}
  ${EndIf}
  Pop $1
  Pop $0
!macroend

!macro customInstall
  !ifndef DO_NOT_CREATE_START_MENU_SHORTCUT
    ${IfNot} ${FileExists} "$newStartMenuLink"
      !insertmacro createMenuDirectory
      CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
      ClearErrors
      WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
    ${EndIf}
  !endif

  # The template relaunches after a silent install only with --force-run, which WinGet does not pass.
  ${If} ${Silent}
  ${AndIfNot} ${isForceRun}
  ${AndIf} $t3AppWasRunning == 1
    HideWindow
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
  ${EndIf}
!macroend
