-- Reference seed values. Run `npm run db:seed` so user passwords are bcrypt hashed.
INSERT INTO app_settings (setting_key, setting_value) VALUES
  ('qr_valid_before_minutes','60'),
  ('qr_valid_after_minutes','180'),
  ('public_app_url','http://localhost:3000'),
  ('application_name','Zeere'),
  ('default_weather_location','Batroun')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);
