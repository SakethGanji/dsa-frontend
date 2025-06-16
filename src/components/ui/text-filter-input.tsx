import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Types
export interface Column {
  id: string;
  label: string;
  type: string;
}

export interface DetectedColumn {
  column: Column;
  start: number;
  end: number;
}

export interface Token {
  type: 'column' | 'operator' | 'logical' | 'parenthesis' | 'number' | 'string';
  start: number;
  end: number;
  text: string;
  data?: Column;
}

export interface TextFilterInputProps {
  columns: Column[];
  value: string;
  onChange: (value: string) => void;
  onColumnDetected?: (column: Column, position: number) => void;
}

// Constants
const OPERATORS = [
  '=', '!=', '>', '<', '>=', '<=', 
  'equals', 'not equals', 'greater than', 'less than', 
  'contains', 'starts with', 'ends with', 'like', 'in', 'not in'
];

const LOGICAL_OPERATORS = ['AND', 'OR', 'NOT', 'and', 'or', 'not'];

const PARENTHESES = ['(', ')'];

const TOKEN_STYLES = {
  column: 'text-blue-400 font-semibold',
  operator: 'text-purple-400 font-bold',
  logical: 'text-orange-400 font-bold uppercase',
  parenthesis: 'text-green-400 font-bold text-lg',
  number: 'text-yellow-400 font-bold',
  string: 'text-yellow-400 font-medium italic'
} as const;

// Token Detection Functions
const detectColumns = (value: string, columns: Column[]): DetectedColumn[] => {
  const matches: DetectedColumn[] = [];
  
  columns.forEach(column => {
    const regex = new RegExp(`\\b${column.id}\\b|\\b${column.label}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(value)) !== null) {
      matches.push({
        column,
        start: match.index,
        end: match.index + match[0].length
      });
    }
  });

  // Sort by position and remove overlaps
  matches.sort((a, b) => a.start - b.start);
  return matches.filter((match, index) => {
    if (index === 0) return true;
    const prevMatch = matches[index - 1];
    return match.start >= prevMatch.end;
  });
};

const detectAllTokens = (value: string, detectedColumns: DetectedColumn[]): Token[] => {
  const allTokens: Token[] = [];
  
  // Add column tokens
  detectedColumns.forEach(detected => {
    allTokens.push({
      type: 'column',
      start: detected.start,
      end: detected.end,
      text: value.substring(detected.start, detected.end),
      data: detected.column
    });
  });

  // Add operator tokens
  OPERATORS.forEach(op => {
    const regex = new RegExp(`\\b${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    let match;
    while ((match = regex.exec(value)) !== null) {
      allTokens.push({
        type: 'operator',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
  });

  // Add logical operator tokens
  LOGICAL_OPERATORS.forEach(op => {
    const regex = new RegExp(`\\b${op}\\b`, 'gi');
    let match;
    while ((match = regex.exec(value)) !== null) {
      allTokens.push({
        type: 'logical',
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
  });

  // Add parentheses tokens
  for (let i = 0; i < value.length; i++) {
    if (PARENTHESES.includes(value[i])) {
      allTokens.push({
        type: 'parenthesis',
        start: i,
        end: i + 1,
        text: value[i]
      });
    }
  }

  // Add number tokens
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  let numberMatch;
  while ((numberMatch = numberRegex.exec(value)) !== null) {
    allTokens.push({
      type: 'number',
      start: numberMatch.index,
      end: numberMatch.index + numberMatch[0].length,
      text: numberMatch[0]
    });
  }

  // Add string tokens
  const stringRegex = /(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g;
  let stringMatch;
  while ((stringMatch = stringRegex.exec(value)) !== null) {
    allTokens.push({
      type: 'string',
      start: stringMatch.index,
      end: stringMatch.index + stringMatch[0].length,
      text: stringMatch[0]
    });
  }

  // Sort tokens by position and remove overlaps
  allTokens.sort((a, b) => a.start - b.start);
  return allTokens.filter((token, index) => {
    if (index === 0) return true;
    const prevToken = allTokens[index - 1];
    return token.start >= prevToken.end;
  });
};

// Syntax Highlighter Component
const SyntaxHighlighter: React.FC<{ value: string; tokens: Token[] }> = ({
  value,
  tokens
}) => {
  if (!value) return null;

  const parts = [];
  let lastEnd = 0;

  tokens.forEach((token, index) => {
    // Add text before the token
    if (token.start > lastEnd) {
      parts.push(
        <span key={`text-${index}`} className="text-gray-300">
          {value.substring(lastEnd, token.start)}
        </span>
      );
    }

    // Add the highlighted token
    parts.push(
      <span
        key={`token-${index}`}
        className={TOKEN_STYLES[token.type]}
      >
        {token.text}
      </span>
    );

    lastEnd = token.end;
  });

  // Add remaining text
  if (lastEnd < value.length) {
    parts.push(
      <span key="text-end" className="text-gray-300">
        {value.substring(lastEnd)}
      </span>
    );
  }

  return (
    <div className="text-sm break-all leading-relaxed font-mono">
      {parts.length > 0 ? parts : (
        <span className="text-green-400 font-mono">{value}</span>
      )}
    </div>
  );
};

// Detected Columns Component
const DetectedColumns: React.FC<{ detectedColumns: DetectedColumn[] }> = ({
  detectedColumns
}) => {
  if (detectedColumns.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <div className="text-xs text-gray-500 mb-2">Detected columns:</div>
      <div className="flex flex-wrap gap-1">
        {detectedColumns.map((detected, index) => (
          <Badge
            key={index}
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            {detected.column.label}
            <span className="ml-1 text-xs opacity-70">({detected.column.type})</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

// Syntax Guide Component
const SyntaxGuide: React.FC = () => {
  return (
    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
      <div className="text-xs text-blue-700 font-semibold mb-2">Syntax Guide:</div>
      <div className="space-y-1 text-xs text-blue-600">
        <div><span className="font-semibold">Color Coding:</span></div>
        <div className="ml-2 space-y-1">
          <div><span className="text-blue-500 font-semibold">Blue:</span> Column names</div>
          <div><span className="text-purple-500 font-semibold">Purple:</span> Operators (=, !=, &gt;, &lt;, contains, etc.)</div>
          <div><span className="text-orange-500 font-semibold">Orange:</span> Logical operators (AND, OR, NOT)</div>
          <div><span className="text-green-500 font-semibold">Green:</span> Parentheses ( )</div>
          <div><span className="text-yellow-500 font-semibold">Yellow:</span> Numbers (bold) and strings (italic)</div>
        </div>
        <div className="mt-2"><span className="font-semibold">Example:</span> age &gt; 30 AND (status = "active" OR region = "US")</div>
      </div>
    </div>
  );
};

// Main Component
export const TextFilterInput: React.FC<TextFilterInputProps> = ({
  columns,
  value,
  onChange,
  onColumnDetected
}) => {
  const [detectedColumns, setDetectedColumns] = useState<DetectedColumn[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const detected = detectColumns(value, columns);
    setDetectedColumns(detected);
  }, [value, columns]);

  const tokens = detectAllTokens(value, detectedColumns);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your filter expression... (e.g., age > 30 AND status = 'active')"
          className="font-mono text-sm"
        />
      </div>
      
      <DetectedColumns detectedColumns={detectedColumns} />

      {value && (
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Syntax Highlighted Preview:</div>
          <SyntaxHighlighter value={value} tokens={tokens} />
        </div>
      )}

      <SyntaxGuide />
    </div>
  );
};

export default TextFilterInput;