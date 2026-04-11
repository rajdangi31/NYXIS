import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

interface ScrambleTextProps {
  text: string | number;
  delay?: number;
  speed?: number;
  maxIterations?: number;
  placeholder?: string;
  style?: object;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  delay = 0,
  speed = 30,
  maxIterations = 10,
  placeholder,
  style,
}) => {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let isCancelled = false;
    const timeout = setTimeout(() => {
      if (isCancelled) return;
      const targetText = String(text);
      let iteration = 0;

      const interval = setInterval(() => {
        if (isCancelled) {
          clearInterval(interval);
          return;
        }

        setDisplay(
          targetText
            .split('')
            .map((char, index) => {
              if (index < iteration / (maxIterations / targetText.length)) {
                return targetText[index];
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('')
        );

        if (iteration >= maxIterations) {
          clearInterval(interval);
          setDisplay(targetText);
        }
        iteration++;
      }, speed);
    }, delay);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [text, delay, speed, maxIterations]);

  const fallback = placeholder ?? String(text).replace(/./g, '-');
  return <Text style={style}>{display || fallback}</Text>;
};
