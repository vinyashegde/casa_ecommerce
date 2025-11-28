import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Settings,
  Play,
  Pause,
  Volume1,
  X,
} from "lucide-react";
import { soundService } from "../utils/soundService";

interface SoundSettingsProps {
  onClose?: () => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState(soundService.getConfig());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setConfig(soundService.getConfig());
  }, []);

  const handleVolumeChange = (volume: number) => {
    soundService.setVolume(volume);
    setConfig(soundService.getConfig());
  };

  const handleToggleEnabled = () => {
    soundService.setEnabled(!config.enabled);
    setConfig(soundService.getConfig());
  };

  const handleTestSound = async () => {
    setIsPlaying(true);
    try {
      await soundService.testNotificationSound();
      setTimeout(() => setIsPlaying(false), 1000);
    } catch (error) {
      console.error("Failed to test sound:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Dark Background Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Centered Sound Settings Modal */}
      <div className="relative glass rounded-2xl p-6 w-96 h-auto max-h-[80vh] border border-white/10 shadow-2xl backdrop-blur-xl bg-gray-900/98 animate-slide-up flex flex-col overflow-hidden"
           onClick={(e) => e.stopPropagation()}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sound Settings</h2>
              <p className="text-gray-400 text-sm">Configure notifications</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
            >
              <X className="w-4 h-4 text-white group-hover:text-red-400 transition-colors" />
            </button>
          )}
        </div>

        {/* Compact Main Settings - Flex layout for container */}
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Compact Enable/Disable Switch */}
          <div className="glass rounded-xl p-4 border border-white/5 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    config.enabled
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
                      : "bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30"
                  }`}
                >
                  {config.enabled ? (
                    <Volume2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Sound Notifications
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Enable notification sounds
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleEnabled}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  config.enabled
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gradient-to-r from-gray-600 to-gray-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
                    config.enabled ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Compact Volume Control */}
          {config.enabled && (
            <div className="glass rounded-xl p-4 border border-white/5 bg-gray-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Volume1 className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Volume</h3>
                  <p className="text-gray-400 text-xs">Adjust volume level</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3))'
                    }}
                  />
                  <Volume2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-center">
                  <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg px-4 py-2 border border-indigo-500/30">
                    <span className="text-white font-semibold text-sm">
                      {Math.round(config.volume * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compact Test Sound */}
          {config.enabled && (
            <div className="glass rounded-xl p-4 border border-white/5 bg-gray-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                  <Play className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Test Sound
                  </h3>
                  <p className="text-gray-400 text-xs">
                    Preview notification sound
                  </p>
                </div>
              </div>
              <button
                onClick={handleTestSound}
                disabled={isPlaying}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 group"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 group-hover:scale-110 transition-transform" />
                ) : (
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-sm font-semibold">
                  {isPlaying ? "Playing..." : "Test Sound"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Compact Footer - Fixed at bottom of square */}
        <div className="flex items-center justify-between space-x-3 pt-4 border-t border-white/20 mt-auto">
          <button
            onClick={() => soundService.resetToDefaults()}
            className="px-4 py-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105 border border-white/20 hover:border-white/30 text-sm"
          >
            Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-indigo-500/25 font-semibold text-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;
