Pod::Spec.new do |s|
  s.name = 'VibeCodingerAgentNotifications'
  s.version = '1.0.0'
  s.summary = 'Local session completion notifications.'
  s.author = 'VibeCodinger'
  s.homepage = 'https://akaaku.net'
  s.platform = :ios, '18.0'
  s.source = { :path => '.' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '*.swift'
  s.frameworks = 'UserNotifications'
end
