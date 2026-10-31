import {
  assignQuestion,
  AssignQuestionPayload,
  getPointQuestionById,
  getQuestionsByPatrolPoint,
  unassignQuestion,
  updatePointQuestion,
  UpdatePointQuestionPayload,
} from "@/src/services/point-questions/point-question.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const usePointQuestions = (patrolPointId: string) => {
  return useQuery({
    queryKey: ["point-questions", patrolPointId],
    queryFn: () => getQuestionsByPatrolPoint(patrolPointId),
    enabled: Boolean(patrolPointId),
  });
};

export const usePointQuestionById = (id: string) => {
  return useQuery({
    queryKey: ["point-question", id],
    queryFn: () => getPointQuestionById(id),
    enabled: Boolean(id),
  });
};

export const useAssignQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignQuestionPayload) => assignQuestion(payload),

    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["point-questions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["questions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-points"],
        }),
      ]);
    },
  });
};

export const useUnassignQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unassignQuestion(id),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["point-questions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["questions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["patrol-points"],
        }),
      ]);
    },
  });
};

export const useUpdatePointQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePointQuestionPayload;
    }) => updatePointQuestion(id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["point-questions"],
      });
    },
  });
};
