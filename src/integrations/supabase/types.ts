export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          active: boolean
          createdAt: string
          id: number
          text: string
          tone: string
        }
        Insert: {
          active?: boolean
          createdAt?: string
          id?: number
          text: string
          tone?: string
        }
        Update: {
          active?: boolean
          createdAt?: string
          id?: number
          text?: string
          tone?: string
        }
        Relationships: []
      }
      careers: {
        Row: {
          fromYear: number
          id: number
          playerId: number
          teamName: string
          toYear: number | null
        }
        Insert: {
          fromYear: number
          id?: number
          playerId: number
          teamName: string
          toYear?: number | null
        }
        Update: {
          fromYear?: number
          id?: number
          playerId?: number
          teamName?: string
          toYear?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "careers_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          createdAt: string
          editedAt: string | null
          id: number
          mediaUrl: string
          name: string
          parentId: number | null
          status: string
          targetId: number
          targetType: string
          userId: number | null
        }
        Insert: {
          body: string
          createdAt?: string
          editedAt?: string | null
          id?: number
          mediaUrl?: string
          name: string
          parentId?: number | null
          status?: string
          targetId: number
          targetType: string
          userId?: number | null
        }
        Update: {
          body?: string
          createdAt?: string
          editedAt?: string | null
          id?: number
          mediaUrl?: string
          name?: string
          parentId?: number | null
          status?: string
          targetId?: number
          targetType?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversationId: number
          id: number
          joinedAt: string
          lastReadAt: string
          role: string
          userId: number
        }
        Insert: {
          conversationId: number
          id?: number
          joinedAt?: string
          lastReadAt?: string
          role?: string
          userId: number
        }
        Update: {
          conversationId?: number
          id?: number
          joinedAt?: string
          lastReadAt?: string
          role?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatarUrl: string
          createdAt: string
          description: string
          id: number
          inviteToken: string
          kind: string
          ownerId: number | null
          poll: Json | null
          title: string
        }
        Insert: {
          avatarUrl?: string
          createdAt?: string
          description?: string
          id?: number
          inviteToken?: string
          kind?: string
          ownerId?: number | null
          poll?: Json | null
          title?: string
        }
        Update: {
          avatarUrl?: string
          createdAt?: string
          description?: string
          id?: number
          inviteToken?: string
          kind?: string
          ownerId?: number | null
          poll?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          createdAt: string
          followerId: number
          followingId: number
          id: number
        }
        Insert: {
          createdAt?: string
          followerId: number
          followingId: number
          id?: number
        }
        Update: {
          createdAt?: string
          followerId?: number
          followingId?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "follows_followerId_fkey"
            columns: ["followerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followingId_fkey"
            columns: ["followingId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          createdAt: string
          fromId: number
          id: number
          status: string
          toId: number
        }
        Insert: {
          createdAt?: string
          fromId: number
          id?: number
          status?: string
          toId: number
        }
        Update: {
          createdAt?: string
          fromId?: number
          id?: number
          status?: string
          toId?: number
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_fromId_fkey"
            columns: ["fromId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_toId_fkey"
            columns: ["toId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery: {
        Row: {
          caption: string
          id: number
          teamId: number
          type: string
          url: string
        }
        Insert: {
          caption: string
          id?: number
          teamId: number
          type?: string
          url: string
        }
        Update: {
          caption?: string
          id?: number
          teamId?: number
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          coverUrl: string
          createdAt: string
          id: number
          storyIds: Json
          title: string
          userId: number
        }
        Insert: {
          coverUrl?: string
          createdAt?: string
          id?: number
          storyIds?: Json
          title: string
          userId: number
        }
        Update: {
          coverUrl?: string
          createdAt?: string
          id?: number
          storyIds?: Json
          title?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "highlights_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          createdAt: string
          id: number
          kind: string
          targetId: number
          targetType: string
          userId: number
        }
        Insert: {
          createdAt?: string
          id?: number
          kind: string
          targetId: number
          targetType: string
          userId: number
        }
        Update: {
          createdAt?: string
          id?: number
          kind?: string
          targetId?: number
          targetType?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "interactions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          expiresAt: string
          id: number
          teamId: number
          token: string
          used: boolean
        }
        Insert: {
          expiresAt: string
          id?: number
          teamId: number
          token: string
          used?: boolean
        }
        Update: {
          expiresAt?: string
          id?: number
          teamId?: number
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invites_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      lineups: {
        Row: {
          formation: string
          id: number
          matchId: number
          positions: Json
          published: boolean
          teamId: number
        }
        Insert: {
          formation?: string
          id?: number
          matchId: number
          positions?: Json
          published?: boolean
          teamId: number
        }
        Update: {
          formation?: string
          id?: number
          matchId?: number
          positions?: Json
          published?: boolean
          teamId?: number
        }
        Relationships: [
          {
            foreignKeyName: "lineups_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineups_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          assistId: number | null
          id: number
          matchId: number
          minute: number
          playerId: number | null
          teamId: number
          type: string
        }
        Insert: {
          assistId?: number | null
          id?: number
          matchId: number
          minute: number
          playerId?: number | null
          teamId: number
          type: string
        }
        Update: {
          assistId?: number | null
          id?: number
          matchId?: number
          minute?: number
          playerId?: number | null
          teamId?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_assistId_fkey"
            columns: ["assistId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          awayId: number
          awayScore: number
          bracketSlot: number | null
          clockPeriod: string
          clockStartedAt: string | null
          date: string
          group: string
          homeId: number
          homeScore: number
          id: number
          minute: number
          motmPlayerId: number | null
          penaltyAway: number | null
          penaltyHome: number | null
          referee: string
          refereeId: number | null
          refereeNames: Json
          report: string
          round: string
          sheetNumber: number | null
          stadium: string
          stage: string
          status: string
          supervisor: string
          time: string
          tournamentId: number | null
          views: number
        }
        Insert: {
          awayId: number
          awayScore?: number
          bracketSlot?: number | null
          clockPeriod?: string
          clockStartedAt?: string | null
          date: string
          group?: string
          homeId: number
          homeScore?: number
          id?: number
          minute?: number
          motmPlayerId?: number | null
          penaltyAway?: number | null
          penaltyHome?: number | null
          referee?: string
          refereeId?: number | null
          refereeNames?: Json
          report?: string
          round?: string
          sheetNumber?: number | null
          stadium: string
          stage?: string
          status?: string
          supervisor?: string
          time: string
          tournamentId?: number | null
          views?: number
        }
        Update: {
          awayId?: number
          awayScore?: number
          bracketSlot?: number | null
          clockPeriod?: string
          clockStartedAt?: string | null
          date?: string
          group?: string
          homeId?: number
          homeScore?: number
          id?: number
          minute?: number
          motmPlayerId?: number | null
          penaltyAway?: number | null
          penaltyHome?: number | null
          referee?: string
          refereeId?: number | null
          refereeNames?: Json
          report?: string
          round?: string
          sheetNumber?: number | null
          stadium?: string
          stage?: string
          status?: string
          supervisor?: string
          time?: string
          tournamentId?: number | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "matches_awayId_fkey"
            columns: ["awayId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_homeId_fkey"
            columns: ["homeId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_motmPlayerId_fkey"
            columns: ["motmPlayerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournamentId_fkey"
            columns: ["tournamentId"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          id: number
          messageId: number
          readAt: string
          userId: number
        }
        Insert: {
          id?: number
          messageId: number
          readAt?: string
          userId: number
        }
        Update: {
          id?: number
          messageId?: number
          readAt?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversationId: number
          createdAt: string
          editedAt: string | null
          id: number
          mediaType: string
          mediaUrl: string
          replyTo: number | null
          text: string
          userId: number
        }
        Insert: {
          conversationId: number
          createdAt?: string
          editedAt?: string | null
          id?: number
          mediaType?: string
          mediaUrl?: string
          replyTo?: number | null
          text?: string
          userId: number
        }
        Update: {
          conversationId?: number
          createdAt?: string
          editedAt?: string | null
          id?: number
          mediaType?: string
          mediaUrl?: string
          replyTo?: number | null
          text?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      motm_votes: {
        Row: {
          id: number
          matchId: number
          playerId: number
          voterId: string
        }
        Insert: {
          id?: number
          matchId: number
          playerId: number
          voterId: string
        }
        Update: {
          id?: number
          matchId?: number
          playerId?: number
          voterId?: string
        }
        Relationships: [
          {
            foreignKeyName: "motm_votes_matchId_fkey"
            columns: ["matchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motm_votes_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string
          category: string
          createdAt: string
          excerpt: string
          id: number
          image: string
          teamId: number | null
          title: string
          views: number
        }
        Insert: {
          body: string
          category: string
          createdAt?: string
          excerpt: string
          id?: number
          image: string
          teamId?: number | null
          title: string
          views?: number
        }
        Update: {
          body?: string
          category?: string
          createdAt?: string
          excerpt?: string
          id?: number
          image?: string
          teamId?: number | null
          title?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          createdAt: string
          durationHours: number
          expiresAt: string
          id: number
          text: string
          userId: number
        }
        Insert: {
          createdAt?: string
          durationHours?: number
          expiresAt: string
          id?: number
          text: string
          userId: number
        }
        Update: {
          createdAt?: string
          durationHours?: number
          expiresAt?: string
          id?: number
          text?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "notes_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actorId: number | null
          createdAt: string
          href: string
          id: number
          kind: string
          read: boolean
          text: string
          userId: number
        }
        Insert: {
          actorId?: number | null
          createdAt?: string
          href?: string
          id?: number
          kind: string
          read?: boolean
          text: string
          userId: number
        }
        Update: {
          actorId?: number | null
          createdAt?: string
          href?: string
          id?: number
          kind?: string
          read?: boolean
          text?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actorId_fkey"
            columns: ["actorId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          conversationId: number
          id: number
          messageId: number
        }
        Insert: {
          conversationId: number
          id?: number
          messageId: number
        }
        Update: {
          conversationId?: number
          id?: number
          messageId?: number
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number
          bio: string
          id: number
          name: string
          number: number
          photo: string
          position: string
          season: string
          teamId: number | null
          userId: number | null
        }
        Insert: {
          age: number
          bio?: string
          id?: number
          name: string
          number: number
          photo?: string
          position: string
          season?: string
          teamId?: number | null
          userId?: number | null
        }
        Update: {
          age?: number
          bio?: string
          id?: number
          name?: string
          number?: number
          photo?: string
          position?: string
          season?: string
          teamId?: number | null
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          id: number
          optionId: number
          pollId: number
          voterId: string
        }
        Insert: {
          id?: number
          optionId: number
          pollId: number
          voterId: string
        }
        Update: {
          id?: number
          optionId?: number
          pollId?: number
          voterId?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_pollId_fkey"
            columns: ["pollId"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          active: boolean
          description: string
          endsAt: string | null
          id: number
          image: string
          options: Json
          question: string
        }
        Insert: {
          active?: boolean
          description?: string
          endsAt?: string | null
          id?: number
          image?: string
          options?: Json
          question: string
        }
        Update: {
          active?: boolean
          description?: string
          endsAt?: string | null
          id?: number
          image?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          audience: Json
          body: string
          createdAt: string
          editedAt: string | null
          hashtags: Json
          id: number
          matchId: number | null
          media_urls: Json
          mediaType: string
          mediaUrl: string
          pollOptions: Json
          pollVoters: Json
          privacy: string
          repostOf: number | null
          status: string
          teamId: number | null
          type: string
          userId: number
          views: number
        }
        Insert: {
          audience?: Json
          body?: string
          createdAt?: string
          editedAt?: string | null
          hashtags?: Json
          id?: number
          matchId?: number | null
          media_urls?: Json
          mediaType?: string
          mediaUrl?: string
          pollOptions?: Json
          pollVoters?: Json
          privacy?: string
          repostOf?: number | null
          status?: string
          teamId?: number | null
          type?: string
          userId: number
          views?: number
        }
        Update: {
          audience?: Json
          body?: string
          createdAt?: string
          editedAt?: string | null
          hashtags?: Json
          id?: number
          matchId?: number | null
          media_urls?: Json
          mediaType?: string
          mediaUrl?: string
          pollOptions?: Json
          pollVoters?: Json
          privacy?: string
          repostOf?: number | null
          status?: string
          teamId?: number | null
          type?: string
          userId?: number
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referees: {
        Row: {
          age: number | null
          badgeNumber: string
          id: number
          leagueName: string
          name: string
          officialStatus: string
          phone: string
          photo: string
          userId: number | null
        }
        Insert: {
          age?: number | null
          badgeNumber?: string
          id?: number
          leagueName?: string
          name: string
          officialStatus?: string
          phone?: string
          photo?: string
          userId?: number | null
        }
        Update: {
          age?: number | null
          badgeNumber?: string
          id?: number
          leagueName?: string
          name?: string
          officialStatus?: string
          phone?: string
          photo?: string
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referees_userId_fkey"
            columns: ["userId"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          active: boolean
          createdAt: string
          description: string
          id: number
          name: string
          summary: Json
        }
        Insert: {
          active?: boolean
          createdAt?: string
          description?: string
          id?: number
          name: string
          summary?: Json
        }
        Update: {
          active?: boolean
          createdAt?: string
          description?: string
          id?: number
          name?: string
          summary?: Json
        }
        Relationships: []
      }
      sessions: {
        Row: {
          expiresAt: string
          id: number
          tokenHash: string
          userId: number
        }
        Insert: {
          expiresAt: string
          id?: number
          tokenHash: string
          userId: number
        }
        Update: {
          expiresAt?: string
          id?: number
          tokenHash?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          branding: Json
          id: number
          labels: Json
          moderation: Json
          privacy: Json
          social: Json
        }
        Insert: {
          branding?: Json
          id?: number
          labels?: Json
          moderation?: Json
          privacy?: Json
          social?: Json
        }
        Update: {
          branding?: Json
          id?: number
          labels?: Json
          moderation?: Json
          privacy?: Json
          social?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          age: number | null
          bio: string
          id: number
          name: string
          photo: string
          role: string
          teamId: number | null
          userId: number | null
        }
        Insert: {
          age?: number | null
          bio?: string
          id?: number
          name: string
          photo?: string
          role?: string
          teamId?: number | null
          userId?: number | null
        }
        Update: {
          age?: number | null
          bio?: string
          id?: number
          name?: string
          photo?: string
          role?: string
          teamId?: number | null
          userId?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          archived: boolean
          caption: string
          createdAt: string
          durationHours: number
          expiresAt: string
          id: number
          status: string
          type: string
          url: string
          userId: number
          viewers: Json
        }
        Insert: {
          archived?: boolean
          caption?: string
          createdAt?: string
          durationHours?: number
          expiresAt: string
          id?: number
          status?: string
          type?: string
          url: string
          userId: number
          viewers?: Json
        }
        Update: {
          archived?: boolean
          caption?: string
          createdAt?: string
          durationHours?: number
          expiresAt?: string
          id?: number
          status?: string
          type?: string
          url?: string
          userId?: number
          viewers?: Json
        }
        Relationships: [
          {
            foreignKeyName: "stories_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suspensions: {
        Row: {
          active: boolean
          endsAt: string | null
          id: number
          issuedOn: string
          matchCount: number
          playerId: number
          startMatchId: number
          teamId: number
          tournamentId: number
          type: string
        }
        Insert: {
          active?: boolean
          endsAt?: string | null
          id?: number
          issuedOn: string
          matchCount?: number
          playerId: number
          startMatchId: number
          teamId: number
          tournamentId: number
          type?: string
        }
        Update: {
          active?: boolean
          endsAt?: string | null
          id?: number
          issuedOn?: string
          matchCount?: number
          playerId?: number
          startMatchId?: number
          teamId?: number
          tournamentId?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspensions_playerId_fkey"
            columns: ["playerId"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_startMatchId_fkey"
            columns: ["startMatchId"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspensions_tournamentId_fkey"
            columns: ["tournamentId"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          achievements: Json
          approved: boolean
          awayColor: string
          bio: string
          color: string
          emblem: string
          founded: number
          id: number
          logo: string
          manager: string
          name: string
          neighborhood: string
          shortName: string
          stadium: string
          views: number
        }
        Insert: {
          achievements?: Json
          approved?: boolean
          awayColor?: string
          bio?: string
          color?: string
          emblem?: string
          founded?: number
          id?: number
          logo?: string
          manager: string
          name: string
          neighborhood: string
          shortName: string
          stadium: string
          views?: number
        }
        Update: {
          achievements?: Json
          approved?: boolean
          awayColor?: string
          bio?: string
          color?: string
          emblem?: string
          founded?: number
          id?: number
          logo?: string
          manager?: string
          name?: string
          neighborhood?: string
          shortName?: string
          stadium?: string
          views?: number
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          description: string
          format: string
          id: number
          name: string
          qualificationRule: string
          qualifiers: number
          season: string
          seasonLabel: string
          sourceTournamentId: number | null
          startDate: string
          status: string
          team_ids: Json
        }
        Insert: {
          description?: string
          format?: string
          id?: number
          name: string
          qualificationRule?: string
          qualifiers?: number
          season?: string
          seasonLabel?: string
          sourceTournamentId?: number | null
          startDate: string
          status?: string
          team_ids?: Json
        }
        Update: {
          description?: string
          format?: string
          id?: number
          name?: string
          qualificationRule?: string
          qualifiers?: number
          season?: string
          seasonLabel?: string
          sourceTournamentId?: number | null
          startDate?: string
          status?: string
          team_ids?: Json
        }
        Relationships: []
      }
      typing_signals: {
        Row: {
          at: string
          conversationId: number
          id: number
          userId: number
        }
        Insert: {
          at?: string
          conversationId: number
          id?: number
          userId: number
        }
        Update: {
          at?: string
          conversationId?: number
          id?: number
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "typing_signals_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "typing_signals_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          authId: string | null
          avatar: string
          badge: string
          badgeTeamId: number | null
          banned: boolean
          bio: string
          createdAt: string
          email: string
          id: number
          mutedUntil: string | null
          name: string
          passwordHash: string
          permissions: Json
          preferences: Json
          restrictedUntil: string | null
          role: string
          showFollowers: boolean
          socials: Json
          teamId: number | null
          username: string
          verified: boolean
          verifiedAt: string | null
          verifiedById: number | null
          verifiedNote: string
        }
        Insert: {
          authId?: string | null
          avatar?: string
          badge?: string
          badgeTeamId?: number | null
          banned?: boolean
          bio?: string
          createdAt?: string
          email: string
          id?: number
          mutedUntil?: string | null
          name: string
          passwordHash?: string
          permissions?: Json
          preferences?: Json
          restrictedUntil?: string | null
          role?: string
          showFollowers?: boolean
          socials?: Json
          teamId?: number | null
          username?: string
          verified?: boolean
          verifiedAt?: string | null
          verifiedById?: number | null
          verifiedNote?: string
        }
        Update: {
          authId?: string | null
          avatar?: string
          badge?: string
          badgeTeamId?: number | null
          banned?: boolean
          bio?: string
          createdAt?: string
          email?: string
          id?: number
          mutedUntil?: string | null
          name?: string
          passwordHash?: string
          permissions?: Json
          preferences?: Json
          restrictedUntil?: string | null
          role?: string
          showFollowers?: boolean
          socials?: Json
          teamId?: number | null
          username?: string
          verified?: boolean
          verifiedAt?: string | null
          verifiedById?: number | null
          verifiedNote?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_teamId_fkey"
            columns: ["teamId"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_exec: { Args: { mode: string; q: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
