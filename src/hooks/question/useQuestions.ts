import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createQuestion,
  createQuestionOption,
  deactivateQuestion,
  getActiveQuestions,
  getQuestions,
  updateQuestionOption,
} from "../../services/question/question.service";
import type {
  CreateQuestionOptionPayload,
  CreateQuestionPayload,
  UpdateQuestionOptionPayload,
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
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) => createQuestion(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });
};

export const useDeactivateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateQuestion(id),

    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["questions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["question", id],
        }),
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
      await queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
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
      await queryClient.invalidateQueries({
        queryKey: ["questions"],
      });
    },
  });
};
