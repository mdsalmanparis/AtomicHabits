import React from 'react';
import { useStore } from '../store/useStore';
import * as Icons from 'lucide-react';

export const AchievementsList: React.FC = () => {
  const achievements = useStore(state => state.achievements);
  
  const getIcon = (iconName: string, unlocked: boolean) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Award;
    return (
      <IconComponent 
        className={`h-6 w-6 transition-all duration-300 ${
          unlocked ? 'text-text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'text-neutral-500'
        }`} 
      />
    );
  };

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;

  return (
    <div className="space-y-6 selection:bg-text-primary selection:text-bg-primary transition-colors">
      {/* Achievements Header Summary */}
      <div className="flex items-center justify-between border-b border-border-primary pb-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-text-primary">Achievements</h2>
          <p className="text-xs text-neutral-500 mt-1">Unlock badges by staying consistent and building your identities</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-text-primary font-poppins">
            {unlockedCount} / {achievements.length}
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-0.5">
            Unlocked
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(ach => {
          const isUnlocked = !!ach.unlocked_at;
          return (
            <div 
              key={ach.id} 
              className={`p-5 rounded-xl border flex gap-4 items-start transition-all duration-350 ${
                isUnlocked 
                  ? 'bg-card-bg border-border-primary' 
                  : 'bg-bg-primary border-border-primary opacity-60'
              }`}
            >
              {/* Icon Container */}
              <div 
                className={`p-3 rounded-lg border shrink-0 ${
                  isUnlocked 
                    ? 'bg-card-bg border-border-hover glow-cyan' 
                    : 'bg-bg-primary border-border-primary'
                }`}
              >
                {getIcon(ach.icon, isUnlocked)}
              </div>

              {/* Text details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-bold font-poppins ${isUnlocked ? 'text-text-primary' : 'text-neutral-500'}`}>
                    {ach.title}
                  </h3>
                  <span 
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                      isUnlocked 
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' 
                        : 'bg-card-bg text-neutral-500 border border-border-primary'
                    }`}
                  >
                    +{ach.xp_reward} XP
                  </span>
                </div>
                
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {ach.description}
                </p>

                {isUnlocked && ach.unlocked_at && (
                  <div className="text-[9px] text-neutral-500 font-medium pt-1">
                    Unlocked on {new Date(ach.unlocked_at).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
