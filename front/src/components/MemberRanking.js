import React from 'react';

const MemberRanking = ({ memberStats }) => {
    const sortedMembers = Object.entries(memberStats || {})
        .filter(([, stats]) => stats.misrecognitions > 0)
        .sort(([, a], [, b]) => b.misrecognitions - a.misrecognitions)
        .slice(0, 5); // Get top 5 misrecognized members

    if (sortedMembers.length === 0) {
        return null; // Don't render anything if there are no misrecognitions
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-blue-800 mb-4">Members to Focus On</h3>
            <ul className="space-y-2">
                {sortedMembers.map(([name, stats], index) => (
                    <li key={name} className="flex justify-between items-center">
                        <span className="text-gray-700">{index + 1}. {name}</span>
                        <span className="text-red-500 font-semibold">
                            {stats.misrecognitions} misrecognition{stats.misrecognitions !== 1 ? 's' : ''}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MemberRanking;
