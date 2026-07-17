import { useState, useEffect, useCallback } from 'react';
import { Model } from '../types';
import { API_CONFIG } from '../config';

export function useModels() {
  const [models] = useState<Model[]>(API_CONFIG.models);
  const [selectedModel, setSelectedModel] = useState<string>(API_CONFIG.defaultModel);

  const fetchModels = useCallback(() => {
    // 在线模式：模型列表已硬编码在 config 中，无需请求
  }, []);

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    selectedModel,
    setSelectedModel,
    fetchModels,
  };
}
