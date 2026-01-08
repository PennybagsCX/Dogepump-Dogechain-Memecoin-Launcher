import React, { useState, useCallback, useEffect } from 'react';
import { useDex } from '../../contexts/DexContext';
import Button from '../Button';
import { logInfo } from '../../utils/dexLogger';

interface DexSettingsProps {
  onClose?: () => void;
  className?: string;
}

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];
const DEADLINE_PRESETS = [10, 20, 30];

const DexSettings: React.FC<DexSettingsProps> = ({ onClose, className = '' }) => {
  const { settings, updateSettings, resetSettings } = useDex();

  const [slippage, setSlippage] = useState(settings.slippage);
  const [customSlippage, setCustomSlippage] = useState('');
  const [deadline, setDeadline] = useState(settings.deadline);
  const [expertMode, setExpertMode] = useState(settings.expertMode);
  const [soundsEnabled, setSoundsEnabled] = useState(settings.soundsEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Play sound effect
  const playSound = useCallback((sound: 'click' | 'success' | 'error') => {
    if (!soundsEnabled) return;

    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }, [soundsEnabled]);

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    if (!notificationsEnabled) return;

    // This would use a toast library like react-hot-toast
    logInfo(`[${type.toUpperCase()}] ${message}`);
  }, [notificationsEnabled]);

  // Check for changes
  useEffect(() => {
    const changed =
      slippage !== settings.slippage ||
      deadline !== settings.deadline ||
      expertMode !== settings.expertMode ||
      soundsEnabled !== settings.soundsEnabled ||
      notificationsEnabled !== settings.notificationsEnabled;

    setHasChanges(changed);
  }, [slippage, deadline, expertMode, soundsEnabled, notificationsEnabled, settings]);

  // Handle slippage preset click
  const handleSlippagePreset = useCallback((preset: number) => {
    playSound('click');
    setSlippage(preset);
    setCustomSlippage('');
  }, [playSound]);

  // Handle custom slippage change
  const handleCustomSlippageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomSlippage(value);

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setSlippage(numValue);
    }
  }, []);

  // Handle deadline preset click
  const handleDeadlinePreset = useCallback((preset: number) => {
    playSound('click');
    setDeadline(preset);
  }, [playSound]);

  // Handle custom deadline change
  const handleCustomDeadlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 60) {
      setDeadline(numValue);
    }
  }, []);

  // Handle expert mode toggle
  const handleExpertModeToggle = useCallback(() => {
    playSound('click');
    setExpertMode(prev => !prev);
  }, [playSound]);

  // Handle sounds enabled toggle
  const handleSoundsEnabledToggle = useCallback(() => {
    playSound('click');
    setSoundsEnabled(prev => !prev);
  }, [playSound]);

  // Handle notifications enabled toggle
  const handleNotificationsEnabledToggle = useCallback(() => {
    playSound('click');
    setNotificationsEnabled(prev => !prev);
  }, []);

  // Handle reset to defaults
  const handleReset = useCallback(() => {
    playSound('click');
    resetSettings();
    setSlippage(0.5);
    setDeadline(20);
    setExpertMode(false);
    setSoundsEnabled(true);
    setNotificationsEnabled(true);
    setCustomSlippage('');
    showToast('Settings reset to defaults', 'info');
  }, [playSound, resetSettings, showToast]);

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      updateSettings({
        slippage,
        deadline,
        expertMode,
        soundsEnabled,
        notificationsEnabled,
      });

      playSound('success');
      setSaveSuccess(true);
      showToast('Settings saved successfully!', 'success');

      setTimeout(() => {
        setSaveSuccess(false);
        setIsSaving(false);
        onClose?.();
      }, 1000);
    } catch (err) {
      playSound('error');
      showToast('Failed to save settings', 'error');
      setIsSaving(false);
    }
  }, [slippage, deadline, expertMode, soundsEnabled, notificationsEnabled, updateSettings, playSound, showToast, onClose]);

  // Validate custom slippage
  const isValidSlippage = useCallback((value: string): boolean => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue > 0 && numValue <= 50;
  }, []);

  // Validate custom deadline
  const isValidDeadline = useCallback((value: string): boolean => {
    const numValue = parseInt(value);
    return !isNaN(numValue) && numValue > 0 && numValue <= 60;
  }, []);

  // Check if custom slippage is active
  const isCustomSlippage = useCallback(() => {
    return !SLIPPAGE_PRESETS.includes(slippage);
  }, [slippage]);

  // Check if custom deadline is active
  const isCustomDeadline = useCallback(() => {
    return !DEADLINE_PRESETS.includes(deadline);
  }, [deadline]);

  return (
    <div className={`dex-settings ${className}`} role="dialog" aria-modal="true" aria-labelledby="settings-title" aria-label="Settings dialog">
      <div className="dex-settings-content">
        <header className="dex-settings-header">
          <h2 id="settings-title">Settings</h2>
          <button
            className="close-button"
            onClick={() => {
              playSound('click');
              onClose?.();
            }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </header>

        <div className="dex-settings-body">
          {/* Slippage Settings */}
          <section className="settings-section" aria-labelledby="slippage-heading">
            <h3 id="slippage-heading">Slippage Tolerance</h3>
            <p className="settings-description">
              Your transaction will revert if the price changes unfavorably by more than this
              percentage.
            </p>

            <div className="slippage-presets" role="group" aria-label="Slippage presets">
              {SLIPPAGE_PRESETS.map(preset => (
                <button
                  key={preset}
                  className={`slippage-preset ${slippage === preset ? 'active' : ''}`}
                  onClick={() => handleSlippagePreset(preset)}
                  aria-label={`Set slippage to ${preset}%`}
                  aria-pressed={slippage === preset}
                >
                  {preset}%
                </button>
              ))}

              <div className="slippage-custom">
                <input
                  type="number"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={handleCustomSlippageChange}
                  className={`custom-input ${isCustomSlippage() ? 'active' : ''} ${!isValidSlippage(customSlippage) && customSlippage ? 'invalid' : ''}`}
                  aria-label="Custom slippage percentage"
                  min="0.01"
                  max="50"
                  step="0.01"
                />
                <span className="input-suffix">%</span>
              </div>
            </div>

            {isCustomSlippage() && (
              <div className="settings-info" role="status" aria-live="polite">
                Custom slippage: {slippage.toFixed(2)}%
              </div>
            )}
          </section>

          {/* Deadline Settings */}
          <section className="settings-section" aria-labelledby="deadline-heading">
            <h3 id="deadline-heading">Transaction Deadline</h3>
            <p className="settings-description">
              Your transaction will revert if it is pending for more than this long.
            </p>

            <div className="deadline-presets" role="group" aria-label="Deadline presets">
              {DEADLINE_PRESETS.map(preset => (
                <button
                  key={preset}
                  className={`deadline-preset ${deadline === preset ? 'active' : ''}`}
                  onClick={() => handleDeadlinePreset(preset)}
                  aria-label={`Set deadline to ${preset} minutes`}
                  aria-pressed={deadline === preset}
                >
                  {preset}m
                </button>
              ))}

              <div className="deadline-custom">
                <input
                  type="number"
                  placeholder="Custom"
                  value={isCustomDeadline() ? deadline : ''}
                  onChange={handleCustomDeadlineChange}
                  className={`custom-input ${isCustomDeadline() ? 'active' : ''}`}
                  aria-label="Custom deadline in minutes"
                  min="1"
                  max="60"
                  step="1"
                />
                <span className="input-suffix">m</span>
              </div>
            </div>

            {isCustomDeadline() && (
              <div className="settings-info" role="status" aria-live="polite">
                Custom deadline: {deadline} minutes
              </div>
            )}
          </section>

          {/* Expert Mode */}
          <section className="settings-section" aria-labelledby="expert-mode-heading">
            <h3 id="expert-mode-heading">Expert Mode</h3>
            <p className="settings-description">
              Bypass confirmation dialogs and enable advanced features. Use at your own risk.
            </p>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={expertMode}
                onChange={handleExpertModeToggle}
                aria-label="Toggle expert mode"
                aria-checked={expertMode}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Expert Mode</span>
            </label>

            {expertMode && (
              <div className="settings-warning" role="alert" aria-live="assertive">
                <strong>Warning:</strong> Expert mode is enabled. You will not see
                confirmation dialogs for high-impact transactions.
              </div>
            )}
          </section>

          {/* Sounds */}
          <section className="settings-section" aria-labelledby="sounds-heading">
            <h3 id="sounds-heading">Sound Effects</h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={soundsEnabled}
                onChange={handleSoundsEnabledToggle}
                aria-label="Toggle sound effects"
                aria-checked={soundsEnabled}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Enable Sounds</span>
            </label>
          </section>

          {/* Notifications */}
          <section className="settings-section" aria-labelledby="notifications-heading">
            <h3 id="notifications-heading">Notifications</h3>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleNotificationsEnabledToggle}
                aria-label="Toggle notifications"
                aria-checked={notificationsEnabled}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Enable Notifications</span>
            </label>
          </section>
        </div>

        <footer className="dex-settings-footer">
          <Button
            className="reset-button"
            onClick={handleReset}
            variant="secondary"
            aria-label="Reset settings to defaults"
          >
            Reset to Defaults
          </Button>

          <Button
            className="save-button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
            aria-label="Save settings"
          >
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default DexSettings;
