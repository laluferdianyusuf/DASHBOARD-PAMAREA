import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateQuestion,
  createQuestion,
  createQuestionOption,
  deactivateQuestion,
  getActiveQuestions,
  getQuestions,
  updateQuestion,
  updateQuestionOption,
} from "../../services/question/question.service";

import type {
  CreateQuestionOptionPayload,
  CreateQuestionPayload,
  UpdateQuestionOptionPayload,
  UpdateQuestionPayload,
} from "../../types";

export const useQuestions = () => {
  return useQuery({
    queryKey: ["questions"],
    queryFn: () => getQuestions(),
  });
};

export const useActiveQuestions = (patrolPointId: string) => {
  return useQuery({
    queryKey: ["questions", patrolPointId],
    queryFn: () => getActiveQuestions(patrolPointId),
    enabled: Boolean(patrolPointId),
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => createQuestion(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateQuestionPayload;
    }) => updateQuestion(id, payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["questions"] }),
        queryClient.invalidateQueries({
          queryKey: ["question", variables.id],
        }),
      ]);
    },
  });
};

export const useDeactivateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateQuestion(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["questions"] }),
        queryClient.invalidateQueries({ queryKey: ["question", id] }),
      ]);
    },
  });
};

export const useActivateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateQuestion(id),
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["questions"] }),
        queryClient.invalidateQueries({ queryKey: ["question", id] }),
      ]);
    },
  });
};

export const useCreateQuestionOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      payload,
    }: {
      questionId: string;
      payload: CreateQuestionOptionPayload;
    }) => createQuestionOption(questionId, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};

export const useUpdateQuestionOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      optionId,
      payload,
    }: {
      optionId: string;
      payload: UpdateQuestionOptionPayload;
    }) => updateQuestionOption(optionId, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
};
