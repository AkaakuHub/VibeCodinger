Pod::Spec.new do |s|
  s.name = 'VibeCodingerVoiceTranscription'
  s.version = '1.0.0'
  s.summary = 'Local recording conversion for VibeCodinger dictation.'
  s.author = 'T3 Tools'
  s.homepage = 'https://github.com/AkaakuHub/t3code'
  s.platform = :ios, '18.0'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
  s.frameworks = 'AudioToolbox'
end
