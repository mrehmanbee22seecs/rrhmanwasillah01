import React from 'react';
import { Mail, Phone, Linkedin, Twitter } from 'lucide-react';
import { Leader } from '../types/leaders';

interface LeaderProfileCardProps {
  leader: Leader;
  onEdit?: () => void;
  isAdmin?: boolean;
}

const LeaderProfileCard: React.FC<LeaderProfileCardProps> = ({ leader, onEdit, isAdmin }) => {
  return (
    <div className="luxury-card bg-cream-white p-6 hover:shadow-luxury-lg transition-all duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img
            src={leader.profileImage || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'}
            alt={leader.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-vibrant-orange shadow-lg"
          />
        </div>

        <h3 className="text-2xl font-luxury-heading text-black mb-2">{leader.name}</h3>
        <p className="text-vibrant-orange font-luxury-semibold mb-4">{leader.role}</p>

        <p className="text-black font-luxury-body text-sm mb-6 line-clamp-4">
          {leader.bio}
        </p>

        <div className="w-full space-y-3">
          {leader.email && (
            <a
              href={`mailto:${leader.email}`}
              className="flex items-center justify-center text-sm text-black hover:text-vibrant-orange transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              {leader.email}
            </a>
          )}

          {leader.phone && (
            <a
              href={`tel:${leader.phone}`}
              className="flex items-center justify-center text-sm text-black hover:text-vibrant-orange transition-colors"
            >
              <Phone className="w-4 h-4 mr-2" />
              {leader.phone}
            </a>
          )}

          <div className="flex justify-center space-x-4 pt-2">
            {leader.linkedIn && (
              <a
                href={leader.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-vibrant-orange transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}

            {leader.twitter && (
              <a
                href={leader.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-vibrant-orange transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="mt-6 w-full btn-luxury-primary py-2 px-4 text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
};

export default LeaderProfileCard;
