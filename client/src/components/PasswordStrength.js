import { useMemo } from 'react';
import zxcvbn from 'zxcvbn';

export default function PasswordStrength({ password }) {
  const analysis = useMemo(() => {
    if (!password) return null;
    return zxcvbn(password);
  }, [password]);

  if (!password || !analysis) return null;

  const score = analysis.score;
  const feedback = analysis.feedback;

  const getColor = () => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLabel = () => {
    if (score >= 4) return 'Very Strong';
    if (score >= 3) return 'Strong';
    if (score >= 2) return 'Fair';
    if (score >= 1) return 'Weak';
    return 'Very Weak';
  };

  return (
    <div className="mt-2 space-y-2 animate-in fade-in duration-300">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/80">Password Strength:</span>
        <span className={`font-medium ${score >= 3 ? 'text-green-400' : score >= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
          {getLabel()}
        </span>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getColor()}`} 
          style={{ width: `${(score + 1) * 20}%` }} 
        />
      </div>
      {(feedback.suggestions.length > 0 || feedback.warning) && (
        <div className="text-xs text-white/80 space-y-1 bg-white/10 rounded-lg p-2 backdrop-blur">
          {feedback.warning && (
            <div className="flex items-start gap-1 animate-in fade-in">
              <span className="text-yellow-400">⚠</span>
              <span>{feedback.warning}</span>
            </div>
          )}
          {feedback.suggestions.map((suggestion, i) => (
            <div key={i} className="flex items-start gap-1 animate-in fade-in">
              <span className="text-purple-400">💡</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

