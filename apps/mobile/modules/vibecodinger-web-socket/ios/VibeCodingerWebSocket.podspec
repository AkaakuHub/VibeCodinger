Pod::Spec.new do |s|
  s.name = 'VibeCodingerWebSocket'
  s.version = '1.0.0'
  s.summary = 'WebSocket client with permessage-deflate for VibeCodinger mobile.'
  s.description = 'React Native ships SocketRocket on iOS, which never negotiates compression. This module dials the VibeCodinger server through URLSessionWebSocketTask, which offers permessage-deflate on its own.'
  s.author = 'T3 Tools'
  s.homepage = 'https://github.com/AkaakuHub/t3code'
  s.platform = :ios, '18.0'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
end
