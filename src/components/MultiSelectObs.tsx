'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectObsProps {
  options: readonly string[] | string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectObs({ options, selectedValues, onChange }: MultiSelectObsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown se o utilizador clicar noutro local da página
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    // Garantir que selectedValues é sempre um array
    const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];
    
    const isSelected = safeSelectedValues.includes(option);
    if (isSelected) {
      onChange(safeSelectedValues.filter(v => v !== option));
    } else {
      onChange([...safeSelectedValues, option]);
    }
  };

  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  // Lógica de exibição limpa no botão principal
  const displayText = safeSelectedValues.length === 0 
    ? "Selecione..." 
    : safeSelectedValues.length === 1 
      ? `${safeSelectedValues[0].substring(0, 25)}...` 
      : `${safeSelectedValues.length} observações`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-white border border-[var(--color-cinza-borda)] rounded-md shadow-sm hover:bg-[var(--color-azul-lightest)] focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-autoridade)] transition-colors min-h-[30px]"
      >
        <span className="truncate text-[var(--color-azul-autoridade)]">{displayText}</span>
        <ChevronDown className="w-4 h-4 text-[var(--color-cinza-texto)] flex-shrink-0" />
      </button>

      {/* Dropdown com Scroll - Renderizado sobre a tabela */}
      {isOpen && (
        <div className="absolute z-[999] w-full lg:w-96 right-0 mt-1 bg-white border border-[var(--color-cinza-borda)] rounded-md shadow-xl max-h-64 overflow-y-auto">
          <ul className="py-1">
            {options.map((option, idx) => {
              const isSelected = safeSelectedValues.includes(option);
              return (
                <li 
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault(); // Impede o fechamento nativo
                    toggleOption(option);
                  }}
                  className="flex items-start px-3 py-2.5 hover:bg-[var(--color-azul-lightest)] cursor-pointer transition-colors border-b border-[var(--color-cinza-fundo)] last:border-0"
                >
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 text-[var(--color-azul-autoridade)] border-gray-300 rounded focus:ring-[var(--color-azul-autoridade)] pointer-events-none"
                    />
                  </div>
                  <div className="ml-3 text-sm text-[var(--color-cinza-escuro)] select-none leading-tight">
                    {option}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
