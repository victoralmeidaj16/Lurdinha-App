// Helpers puros para ranking e prazos de quizzes de um grupo.
// Usados pela tela de detalhe do grupo e pelos cards da lista de grupos.

export const getQuizGroupEndDate = (quizGroup = {}) => {
  if (!quizGroup.endTime) return null;
  if (quizGroup.endTime?.toDate) return quizGroup.endTime.toDate();

  const endDate = new Date(quizGroup.endTime);
  return Number.isNaN(endDate.getTime()) ? null : endDate;
};

export const getQuizGroupSortTime = (quizGroup = {}) => {
  const date = getQuizGroupEndDate(quizGroup);
  if (date) return date.getTime();
  if (quizGroup.updatedAt?.toDate) return quizGroup.updatedAt.toDate().getTime();
  if (quizGroup.createdAt?.toDate) return quizGroup.createdAt.toDate().getTime();
  return 0;
};

// Momento da última movimentação de um quiz (criação ou atualização).
export const getQuizGroupActivityTime = (quizGroup = {}) => {
  const toTime = (value) => {
    if (!value) return 0;
    if (value.toDate) return value.toDate().getTime();
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  return Math.max(toTime(quizGroup.updatedAt), toTime(quizGroup.createdAt));
};

export const getRankScore = (rank = {}) => (
  rank.correct ||
  rank.totalCorrect ||
  rank.score ||
  rank.points ||
  0
);

export const getRankingDisplayName = (rank = {}, rankingType) => {
  if (rankingType === 'teams') {
    return rank.teamName || rank.teamMembers?.map(member => member.name).join(', ') || 'Time';
  }

  return rank.name || rank.displayName || rank.username || 'Usuário';
};

export const getQuizGroupsWithRanking = (groups = []) => (
  groups
    .filter(quizGroup => quizGroup.ranking && quizGroup.ranking.length > 0)
    .sort((first, second) => getQuizGroupSortTime(second) - getQuizGroupSortTime(first))
);

export const getGroupRankingSummary = (groups = [], currentUserId) => {
  const rankingMap = {};
  const rankedQuizGroups = getQuizGroupsWithRanking(groups);

  rankedQuizGroups.forEach((quizGroup) => {
    quizGroup.ranking.forEach((rank) => {
      if (quizGroup.rankingType === 'teams') {
        rank.teamMembers?.forEach((member) => {
          const userId = member.userId || member.uid || member.id;
          if (!userId) return;

          if (!rankingMap[userId]) {
            rankingMap[userId] = {
              userId,
              name: member.name || member.displayName || 'Usuário',
              photoURL: member.photoURL,
              score: 0,
              participations: 0,
            };
          }

          rankingMap[userId].score += getRankScore(rank);
          rankingMap[userId].participations += 1;
        });
        return;
      }

      const userId = rank.userId || rank.uid || rank.id;
      if (!userId) return;

      if (!rankingMap[userId]) {
        rankingMap[userId] = {
          userId,
          name: getRankingDisplayName(rank, quizGroup.rankingType),
          photoURL: rank.photoURL,
          score: 0,
          participations: 0,
        };
      }

      rankingMap[userId].score += getRankScore(rank);
      rankingMap[userId].participations += 1;
    });
  });

  const ranking = Object.values(rankingMap).sort((first, second) => (
    second.score - first.score ||
    second.participations - first.participations ||
    first.name.localeCompare(second.name)
  ));

  const currentUserIndex = ranking.findIndex(rank => rank.userId === currentUserId);

  return {
    latestRanking: rankedQuizGroups[0] || null,
    ranking,
    topThree: ranking.slice(0, 3),
    currentUserRank: currentUserIndex >= 0
      ? { ...ranking[currentUserIndex], position: currentUserIndex + 1 }
      : null,
  };
};
